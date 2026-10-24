import express from "express";
import QRCode from "qrcode";
import { randomUUID, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config/env.js";
import { pool } from "./db/pool.js";
import { ensureDefaultRoles } from "./modules/access/default-roles.js";
import { hashPassword, verifyPassword } from "./security/passwords.js";
import {
  derivePublicOrderToken,
  hashToken,
  signToken,
  stableHash,
  verifyToken
} from "./security/tokens.js";

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const config = loadConfig();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireString(value, field, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new HttpError(400, "VALIDATION_ERROR", `${field} is required.`);
  }
  return value.trim();
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    throw new HttpError(400, "VALIDATION_ERROR", "items must contain between 1 and 20 entries.");
  }
  const values = new Map();
  for (const item of items) {
    if (!item || !UUID_PATTERN.test(item.slotId ?? "") ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new HttpError(400, "VALIDATION_ERROR", "Each item needs a valid slotId and quantity from 1 to 100.");
    }
    values.set(item.slotId, (values.get(item.slotId) ?? 0) + item.quantity);
  }
  return [...values.entries()]
    .map(([slotId, quantity]) => ({ slotId, quantity }))
    .sort((left, right) => left.slotId.localeCompare(right.slotId));
}

function getDateRange(query) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to ||
      to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new HttpError(400, "VALIDATION_ERROR", "Provide a valid date range of no more than 366 days.");
  }
  return [from.toISOString(), to.toISOString()];
}

function getReportFilters(query, tenantId, {
  tenantField,
  machineField,
  orderField,
  productField,
  statusField,
  dateField,
  defaultDateRange = false
}) {
  const values = [tenantId];
  const clauses = [`${tenantField} = $1`];
  const add = (value, predicate) => {
    const placeholder = `$${values.length + 1}`;
    values.push(value);
    clauses.push(predicate(placeholder));
  };
  let from;
  let to;

  if (dateField && (defaultDateRange || query.from !== undefined || query.to !== undefined)) {
    [from, to] = getDateRange(query);
    add(from, (placeholder) => `${dateField} >= ${placeholder}`);
    add(to, (placeholder) => `${dateField} < ${placeholder}`);
  } else if (query.from !== undefined || query.to !== undefined) {
    throw new HttpError(400, "VALIDATION_ERROR", "Date filters are not supported for this report.");
  }

  if (query.locationId !== undefined) {
    if (!UUID_PATTERN.test(query.locationId)) throw new HttpError(400, "VALIDATION_ERROR", "locationId must be a UUID.");
    if (!machineField) throw new HttpError(400, "VALIDATION_ERROR", "locationId is not supported for this report.");
    add(query.locationId, (placeholder) =>
      `EXISTS (SELECT 1 FROM vending_machines filter_vm
       WHERE filter_vm.id = ${machineField} AND filter_vm.tenant_id = $1
         AND filter_vm.location_id = ${placeholder})`);
  }
  if (query.machineId !== undefined) {
    if (!UUID_PATTERN.test(query.machineId)) throw new HttpError(400, "VALIDATION_ERROR", "machineId must be a UUID.");
    if (!machineField) throw new HttpError(400, "VALIDATION_ERROR", "machineId is not supported for this report.");
    add(query.machineId, (placeholder) => `${machineField} = ${placeholder}`);
  }
  if (query.productId !== undefined) {
    if (!UUID_PATTERN.test(query.productId)) throw new HttpError(400, "VALIDATION_ERROR", "productId must be a UUID.");
    if (productField) {
      add(query.productId, (placeholder) => `${productField} = ${placeholder}`);
    } else if (orderField) {
      add(query.productId, (placeholder) =>
        `EXISTS (SELECT 1 FROM order_items filter_oi
         WHERE filter_oi.order_id = ${orderField} AND filter_oi.tenant_id = $1
           AND filter_oi.product_id = ${placeholder})`);
    } else {
      throw new HttpError(400, "VALIDATION_ERROR", "productId is not supported for this report.");
    }
  }
  if (query.status !== undefined) {
    const status = requireString(query.status, "status", 40);
    if (!/^[a-z_]+$/.test(status)) throw new HttpError(400, "VALIDATION_ERROR", "status is invalid.");
    if (!statusField) throw new HttpError(400, "VALIDATION_ERROR", "status is not supported for this report.");
    add(status, (placeholder) => `${statusField} = ${placeholder}`);
  }

  return { where: clauses.join(" AND "), values, from, to };
}

function sendError(error, requestId, res) {
  const databaseStatus = {
    "23505": [409, "RESOURCE_CONFLICT"],
    "23503": [400, "VALIDATION_ERROR"],
    "23514": [400, "VALIDATION_ERROR"],
    "22P02": [400, "VALIDATION_ERROR"],
    "08000": [503, "DATABASE_UNAVAILABLE"],
    "08003": [503, "DATABASE_UNAVAILABLE"],
    "08006": [503, "DATABASE_UNAVAILABLE"],
    "57P01": [503, "DATABASE_UNAVAILABLE"]
  }[error.code];
  const status = Number.isInteger(error.status) ? error.status : (databaseStatus?.[0] ?? 500);
  const code = error.status ? error.code : (databaseStatus?.[1] ?? "INTERNAL_ERROR");
  const safeDatabaseMessage = {
    "23505": "A resource with these values already exists.",
    "23503": "Request references a resource that is unavailable.",
    "23514": "Request violates a data constraint.",
    "22P02": "Request contains an invalid value.",
    "08000": "The database is unavailable.",
    "08003": "The database is unavailable.",
    "08006": "The database is unavailable.",
    "57P01": "The database is unavailable."
  }[error.code];
  const message = error instanceof HttpError
    ? error.message
    : (safeDatabaseMessage ?? "An unexpected error occurred.");
  if (status === 500) {
    console.error(JSON.stringify({
      level: "error",
      requestId,
      event: "request_failed",
      databaseCode: error.code ?? "UNKNOWN"
    }));
  }
  res.status(status).json({
    error: { code, message, requestId, details: [] }
  });
}

function addAudit(client, req, tenantId, actorType, actorId, action, resourceType, resourceId, metadata = {}) {
  return client.query(
    `INSERT INTO audit_events
       (tenant_id, actor_type, actor_id, action, resource_type, resource_id, request_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [tenantId, actorType, actorId, action, resourceType, resourceId, req.requestId, metadata]
  );
}

async function startIdempotent(client, tenantId, operation, key, requestHash) {
  await client.query(
    `INSERT INTO idempotency_records
       (tenant_id, key, operation, request_hash, status, expires_at)
     VALUES ($1, $2, $3, $4, 'processing', now() + interval '24 hours')
     ON CONFLICT (tenant_id, operation, key) DO NOTHING`,
    [tenantId, key, operation, requestHash]
  );
  const result = await client.query(
    `SELECT * FROM idempotency_records
     WHERE tenant_id = $1 AND operation = $2 AND key = $3
     FOR UPDATE`,
    [tenantId, operation, key]
  );
  const record = result.rows[0];
  if (!record) throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "The idempotency record could not be acquired.");
  if (record.request_hash !== requestHash) {
    throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different request.");
  }
  if (record.status === "completed") {
    return { replay: true, status: record.response_status, body: record.response_body };
  }
  return { replay: false };
}

async function finishIdempotent(client, tenantId, operation, key, status, body) {
  await client.query(
    `UPDATE idempotency_records
     SET status = 'completed', response_status = $4, response_body = $5
     WHERE tenant_id = $1 AND operation = $2 AND key = $3`,
    [tenantId, operation, key, status, body]
  );
}

async function releaseReservations(client, orderId, status) {
  const reservations = await client.query(
    `SELECT id, tenant_id, slot_id, quantity
     FROM inventory_reservations
     WHERE order_id = $1 AND status = 'active'
     ORDER BY slot_id
     FOR UPDATE`,
    [orderId]
  );
  for (const reservation of reservations.rows) {
    await client.query(
      `UPDATE machine_slots SET reserved = reserved - $2, updated_at = now()
       WHERE id = $1 AND reserved >= $2`,
      [reservation.slot_id, reservation.quantity]
    );
    await client.query(
      `UPDATE inventory_reservations
       SET status = $2, released_at = now()
       WHERE id = $1`,
      [reservation.id, status]
    );
  }
}

function userAuth(db, secret) {
  return async (req, res, next) => {
    try {
      const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
      const claims = token ? verifyToken(token, secret) : null;
      if (!claims || claims.kind !== "user" || !claims.userId || !claims.tenantId) {
        throw new HttpError(401, "AUTHENTICATION_REQUIRED", "A valid user access token is required.");
      }
      const result = await db.query(
        `SELECT u.id AS user_id, tm.id AS membership_id, t.id AS tenant_id,
                t.status AS tenant_status, tm.status AS membership_status,
                array_remove(array_agg(DISTINCT p.code), NULL) AS permissions
         FROM users u
         JOIN tenant_memberships tm ON tm.user_id = u.id
         JOIN tenants t ON t.id = tm.tenant_id
         LEFT JOIN membership_roles mr ON mr.membership_id = tm.id AND mr.tenant_id = tm.tenant_id
         LEFT JOIN roles r ON r.id = mr.role_id AND r.tenant_id = tm.tenant_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1 AND tm.tenant_id = $2 AND u.status = 'active'
         GROUP BY u.id, tm.id, t.id, t.status, tm.status`,
        [claims.userId, claims.tenantId]
      );
      const row = result.rows[0];
      if (!row || row.membership_status !== "active") {
        throw new HttpError(403, "PERMISSION_DENIED", "The active membership is unavailable.");
      }
      req.auth = {
        kind: "user",
        userId: row.user_id,
        membershipId: row.membership_id,
        tenantId: row.tenant_id,
        tenantStatus: row.tenant_status,
        permissions: row.permissions ?? []
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

function deviceAuth(db, secret) {
  return async (req, res, next) => {
    try {
      const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
      const claims = token ? verifyToken(token, secret) : null;
      if (!claims || claims.kind !== "device" || !claims.machineId || !claims.tenantId) {
        throw new HttpError(401, "AUTHENTICATION_REQUIRED", "A valid device access token is required.");
      }
      const result = await db.query(
        `SELECT vm.id, vm.tenant_id, vm.status, t.status AS tenant_status
         FROM vending_machines vm JOIN tenants t ON t.id = vm.tenant_id
         WHERE vm.id = $1 AND vm.tenant_id = $2`,
        [claims.machineId, claims.tenantId]
      );
      const machine = result.rows[0];
      if (!machine || machine.status === "suspended" || machine.tenant_status !== "active") {
        throw new HttpError(403, "DEVICE_NOT_AUTHORIZED", "The device is not authorized.");
      }
      req.auth = {
        kind: "device",
        machineId: machine.id,
        tenantId: machine.tenant_id,
        machineStatus: machine.status
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

function platformAuth(db, secret) {
  return async (req, res, next) => {
    try {
      const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
      const claims = token ? verifyToken(token, secret) : null;
      if (!claims || claims.kind !== "platform" || !claims.userId) {
        throw new HttpError(401, "AUTHENTICATION_REQUIRED", "A platform access token is required.");
      }
      const result = await db.query(
        `SELECT u.id FROM users u JOIN platform_administrators pa ON pa.user_id = u.id
         WHERE u.id = $1 AND u.status = 'active'`,
        [claims.userId]
      );
      if (!result.rowCount) throw new HttpError(403, "PERMISSION_DENIED", "Platform access is unavailable.");
      req.platform = { userId: result.rows[0].id };
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requirePermission(permission, { mutable = false } = {}) {
  return (req, res, next) => {
    if (req.auth?.kind !== "user") {
      return next(new HttpError(401, "AUTHENTICATION_REQUIRED", "A user access token is required."));
    }
    if (!req.auth.permissions.includes(permission)) {
      return next(new HttpError(403, "PERMISSION_DENIED", "You do not have permission for this operation."));
    }
    if (mutable && req.auth.tenantStatus !== "active") {
      return next(new HttpError(409, "TENANT_NOT_ACTIVE", "This tenant does not accept changes."));
    }
    next();
  };
}

function createRateLimiter(maximum, windowMs, code = "RATE_LIMITED") {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 5000) {
      for (const [ip, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(ip);
      }
    }
    if (bucket.count > maximum) {
      return next(new HttpError(429, code, "Too many attempts. Try again later."));
    }
    next();
  };
}

async function assertLastAdminSafe(client, tenantId, currentMembershipId, remainsAdmin) {
  if (remainsAdmin) return;
  const current = await client.query(
    `SELECT 1 FROM membership_roles mr
     JOIN roles r ON r.id = mr.role_id AND r.tenant_id = mr.tenant_id
     WHERE mr.membership_id = $1 AND mr.tenant_id = $2 AND lower(r.name) = 'tenant_admin'`,
    [currentMembershipId, tenantId]
  );
  if (!current.rowCount) return;
  const activeAdmins = await client.query(
    `SELECT count(DISTINCT tm.id)::int AS count
     FROM tenant_memberships tm
     JOIN membership_roles mr ON mr.membership_id = tm.id AND mr.tenant_id = tm.tenant_id
     JOIN roles r ON r.id = mr.role_id AND r.tenant_id = mr.tenant_id
     WHERE tm.tenant_id = $1 AND tm.status = 'active' AND lower(r.name) = 'tenant_admin'`,
    [tenantId]
  );
  if (activeAdmins.rows[0].count <= 1) {
    throw new HttpError(409, "INVALID_STATUS_TRANSITION", "The last active tenant administrator cannot be removed.");
  }
}

async function expireReservations(inDbTransaction) {
  await inDbTransaction(async (client) => {
    const awaitingPayment = await client.query(
      `SELECT o.id, o.tenant_id
       FROM orders o
       WHERE o.status = 'awaiting_payment' AND o.reservation_expires_at <= now()
       ORDER BY o.reservation_expires_at
       LIMIT 100
       FOR UPDATE OF o SKIP LOCKED`
    );
    for (const order of awaitingPayment.rows) {
      await releaseReservations(client, order.id, "expired");
      await client.query(
        "UPDATE orders SET status = 'expired', updated_at = now() WHERE id = $1",
        [order.id]
      );
      await addAudit(client, { requestId: null }, order.tenant_id, "system", null, "reservation.expired", "order", order.id);
    }

    const queuedJobs = await client.query(
      `SELECT j.id, j.order_id, j.tenant_id, j.status
       FROM dispense_jobs j JOIN orders o ON o.id = j.order_id AND o.tenant_id = j.tenant_id
       WHERE j.status IN ('queued', 'failed')
         AND o.status IN ('paid', 'failed')
         AND o.reservation_expires_at <= now()
         AND EXISTS (
           SELECT 1 FROM inventory_reservations r
           WHERE r.order_id = o.id AND r.tenant_id = o.tenant_id AND r.status = 'active'
             AND r.expires_at <= now()
         )
       ORDER BY o.reservation_expires_at
       LIMIT 100
       FOR UPDATE OF j SKIP LOCKED`
    );
    for (const job of queuedJobs.rows) {
      await releaseReservations(client, job.order_id, "expired");
      if (job.status === "queued") {
        await client.query(
          "UPDATE dispense_jobs SET status = 'cancelled', updated_at = now() WHERE id = $1",
          [job.id]
        );
      }
      await client.query(
        "UPDATE orders SET status = 'expired', updated_at = now() WHERE id = $1",
        [job.order_id]
      );
      await addAudit(client, { requestId: null }, job.tenant_id, "system", null, "reservation.expired", "dispense_job", job.id);
    }
  });
}

export function createApp({ db = pool, jwtSecret = config.jwtSecret, corsOrigins = config.corsOrigins } = {}) {
  const app = express();
  const authenticateUser = userAuth(db, jwtSecret);
  const authenticateDevice = deviceAuth(db, jwtSecret);
  const authenticatePlatform = platformAuth(db, jwtSecret);
  const rateBuckets = new Map();
  const loginRateLimit = createRateLimiter(10, 15 * 60_000);
  const platformLoginRateLimit = createRateLimiter(10, 15 * 60_000);
  const deviceRateLimit = createRateLimiter(30, 60_000);
  async function inDbTransaction(work) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set("X-Request-Id", req.requestId);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "no-referrer");
    next();
  });
  app.use((req, res, next) => {
    const origin = req.get("origin");
    const isSameOrigin = origin === `${req.protocol}://${req.get("host")}`;
    if (origin && !isSameOrigin && !corsOrigins.includes(origin)) {
      return next(new HttpError(403, "PERMISSION_DENIED", "Origin is not allowed."));
    }
    if (origin && !isSameOrigin) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key");
      res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use((req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const bucket = rateBuckets.get(key) ?? { count: 0, resetAt: now + 60_000 };
    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + 60_000;
    }
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (rateBuckets.size > 5000) {
      for (const [ip, value] of rateBuckets) {
        if (value.resetAt <= now) rateBuckets.delete(ip);
      }
    }
    if (bucket.count > 120) {
      return next(new HttpError(429, "RATE_LIMITED", "Too many requests. Try again shortly."));
    }
    next();
  });
  app.use(express.json({ limit: "64kb", strict: true }));
  app.use((req, res, next) => {
    res.on("finish", () => {
      console.log(JSON.stringify({
        level: "info",
        requestId: req.requestId,
        method: req.method,
        path: req.path.replace(/^\/api\/v1\/public\/orders\/[^/]+(?=\/|$)/, "/api/v1/public/orders/:publicToken"),
        status: res.statusCode
      }));
    });
    next();
  });

  app.get("/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));
  app.get("/ready", async (req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "ready" });
    } catch (error) {
      console.error(JSON.stringify({ level: "error", requestId: req.requestId, event: "readiness_failed", code: error.code ?? "UNKNOWN" }));
      sendError(new HttpError(503, "DATABASE_UNAVAILABLE", "The database is unavailable."), req.requestId, res);
    }
  });

  const api = express.Router();
  api.get("/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));
  api.get("/ready", async (req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "ready" });
    } catch (error) {
      console.error(JSON.stringify({ level: "error", requestId: req.requestId, event: "readiness_failed", code: error.code ?? "UNKNOWN" }));
      sendError(new HttpError(503, "DATABASE_UNAVAILABLE", "The database is unavailable."), req.requestId, res);
    }
  });
  app.use("/api/v1", api);

  api.post("/auth/login", loginRateLimit, async (req, res) => {
    const email = requireString(req.body?.email, "email", 320).toLowerCase();
    const password = req.body?.password;
    if (typeof password !== "string" || password.length === 0 || password.length > 1024) {
      throw new HttpError(400, "VALIDATION_ERROR", "password is required.");
    }
    const tenantId = req.body?.tenantId ?? null;
    if (tenantId !== null && !UUID_PATTERN.test(tenantId)) {
      throw new HttpError(400, "VALIDATION_ERROR", "tenantId must be a UUID.");
    }
    const result = await db.query(
      `SELECT u.id, u.password_hash, u.display_name, tm.tenant_id, tm.id AS membership_id
       FROM users u
       JOIN tenant_memberships tm ON tm.user_id = u.id AND tm.status = 'active'
       JOIN tenants t ON t.id = tm.tenant_id AND t.status = 'active'
       WHERE lower(u.email) = $1 AND u.status = 'active'
         AND ($2::uuid IS NULL OR tm.tenant_id = $2)
       ORDER BY tm.joined_at
       LIMIT 1`,
      [email, tenantId]
    );
    const user = result.rows[0];
    const valid = user ? await verifyPassword(password, user.password_hash) : false;
    if (!valid) throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    const refreshToken = randomBytes(48).toString("base64url");
    await inDbTransaction(async (client) => {
      await client.query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, tenant_id, family_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4, now() + interval '30 days')`,
        [user.id, user.tenant_id, randomUUID(), hashToken(refreshToken)]
      );
    });
    res.json({
      data: {
        accessToken: signToken({ kind: "user", userId: user.id, tenantId: user.tenant_id }, jwtSecret),
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 900,
        user: { id: user.id, displayName: user.display_name, tenantId: user.tenant_id }
      }
    });
  });

  api.post("/platform/auth/login", platformLoginRateLimit, async (req, res) => {
    const email = requireString(req.body?.email, "email", 320).toLowerCase();
    const password = req.body?.password;
    if (typeof password !== "string" || password.length === 0 || password.length > 1024) {
      throw new HttpError(400, "VALIDATION_ERROR", "password is required.");
    }
    const result = await db.query(
      `SELECT u.id, u.password_hash, u.display_name
       FROM users u JOIN platform_administrators pa ON pa.user_id = u.id
       WHERE lower(u.email) = $1 AND u.status = 'active'`,
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }
    res.json({
      data: {
        accessToken: signToken({ kind: "platform", userId: user.id }, jwtSecret),
        tokenType: "Bearer",
        expiresIn: 900,
        user: { id: user.id, displayName: user.display_name }
      }
    });
  });

  api.get("/platform/tenants", authenticatePlatform, async (req, res) => {
    const result = await db.query(
      `SELECT id, slug, name, status, created_at AS "createdAt"
       FROM tenants ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ data: result.rows });
  });

  api.post("/platform/tenants", authenticatePlatform, async (req, res) => {
    const slug = requireString(req.body?.slug, "slug", 80).toLowerCase();
    const name = requireString(req.body?.name, "name", 160);
    const adminEmail = requireString(req.body?.adminEmail, "adminEmail", 320).toLowerCase();
    const adminName = requireString(req.body?.adminDisplayName, "adminDisplayName", 160);
    const adminPassword = req.body?.adminPassword;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) ||
        (adminPassword !== undefined && (typeof adminPassword !== "string" || adminPassword.length < 12 || adminPassword.length > 1024))) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a valid tenant slug, admin email, and optional 12-character admin password.");
    }
    const tenant = await inDbTransaction(async (client) => {
      const userLookup = await client.query(
        "SELECT id FROM users WHERE lower(email) = $1 FOR UPDATE",
        [adminEmail]
      );
      let userId = userLookup.rows[0]?.id;
      if (!userId) {
        if (!adminPassword) throw new HttpError(400, "VALIDATION_ERROR", "adminPassword is required for a new user.");
        const newUser = await client.query(
          `INSERT INTO users (email, password_hash, display_name)
           VALUES ($1, $2, $3) RETURNING id`,
          [adminEmail, await hashPassword(adminPassword), adminName]
        );
        userId = newUser.rows[0].id;
      }
      const created = await client.query(
        `INSERT INTO tenants (slug, name) VALUES ($1, $2)
         RETURNING id, slug, name, status, created_at AS "createdAt"`,
        [slug, name]
      );
      const tenantId = created.rows[0].id;
      const roles = await ensureDefaultRoles(client, tenantId);
      const membership = await client.query(
        `INSERT INTO tenant_memberships (tenant_id, user_id) VALUES ($1, $2) RETURNING id`,
        [tenantId, userId]
      );
      await client.query(
        `INSERT INTO membership_roles (tenant_id, membership_id, role_id) VALUES ($1, $2, $3)`,
        [tenantId, membership.rows[0].id, roles.get("tenant_admin")]
      );
      await addAudit(client, req, tenantId, "platform", req.platform.userId, "tenant.created", "tenant", tenantId);
      return created.rows[0];
    });
    res.status(201).json({ data: tenant });
  });

  api.get("/platform/tenants/:id", authenticatePlatform, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Tenant id must be a UUID.");
    const result = await db.query(
      `SELECT id, slug, name, status, settings, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tenants WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Tenant not found.");
    res.json({ data: result.rows[0] });
  });

  api.patch("/platform/tenants/:id", authenticatePlatform, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Tenant id must be a UUID.");
    const name = requireString(req.body?.name, "name", 160);
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE tenants SET name = $2, updated_at = now()
         WHERE id = $1 AND status <> 'archived'
         RETURNING id, slug, name, status`,
        [req.params.id, name]
      );
      if (!updated.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Tenant not found or archived.");
      await addAudit(client, req, req.params.id, "platform", req.platform.userId, "tenant.updated", "tenant", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/platform/tenants/:id/suspend", authenticatePlatform, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Tenant id must be a UUID.");
    const tenant = await inDbTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenants SET status = 'suspended', updated_at = now()
         WHERE id = $1 AND status = 'active' RETURNING id, slug, name, status`,
        [req.params.id]
      );
      if (!result.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Tenant cannot be suspended from its current state.");
      await addAudit(client, req, req.params.id, "platform", req.platform.userId, "tenant.suspended", "tenant", req.params.id);
      return result.rows[0];
    });
    res.json({ data: tenant });
  });

  api.post("/platform/tenants/:id/activate", authenticatePlatform, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Tenant id must be a UUID.");
    const tenant = await inDbTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenants SET status = 'active', updated_at = now()
         WHERE id = $1 AND status = 'suspended' RETURNING id, slug, name, status`,
        [req.params.id]
      );
      if (!result.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Only suspended tenants can be activated.");
      await addAudit(client, req, req.params.id, "platform", req.platform.userId, "tenant.activated", "tenant", req.params.id);
      return result.rows[0];
    });
    res.json({ data: tenant });
  });

  api.post("/platform/tenants/:id/archive", authenticatePlatform, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Tenant id must be a UUID.");
    const tenant = await inDbTransaction(async (client) => {
      const result = await client.query(
        `UPDATE tenants SET status = 'archived', updated_at = now()
         WHERE id = $1 AND status IN ('active', 'suspended')
         RETURNING id, slug, name, status`,
        [req.params.id]
      );
      if (!result.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Tenant cannot be archived from its current state.");
      await addAudit(client, req, req.params.id, "platform", req.platform.userId, "tenant.archived", "tenant", req.params.id);
      return result.rows[0];
    });
    res.json({ data: tenant });
  });

  api.post("/auth/refresh", async (req, res) => {
    const oldToken = requireString(req.body?.refreshToken, "refreshToken", 512);
    const oldHash = hashToken(oldToken);
    const nextRefreshToken = randomBytes(48).toString("base64url");
    const rotation = await inDbTransaction(async (client) => {
      const current = await client.query(
        `SELECT rt.id, rt.user_id, rt.family_id, rt.expires_at, rt.used_at, rt.revoked_at,
                rt.tenant_id
         FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id AND u.status = 'active'
         JOIN tenant_memberships tm ON tm.user_id = u.id AND tm.tenant_id = rt.tenant_id AND tm.status = 'active'
         JOIN tenants t ON t.id = rt.tenant_id AND t.status = 'active'
         WHERE rt.token_hash = $1
         FOR UPDATE OF rt`,
        [oldHash]
      );
      const token = current.rows[0];
      if (!token) return { invalid: true };
      if (token.used_at || token.revoked_at) {
        await client.query(
          "UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now()) WHERE family_id = $1",
          [token.family_id]
        );
        return { invalid: true, reused: true };
      }
      if (new Date(token.expires_at).getTime() <= Date.now()) {
        await client.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [token.id]);
        return { invalid: true };
      }
      await client.query("UPDATE refresh_tokens SET used_at = now() WHERE id = $1", [token.id]);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, tenant_id, family_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4, now() + interval '30 days')`,
        [token.user_id, token.tenant_id, token.family_id, hashToken(nextRefreshToken)]
      );
      return { userId: token.user_id, tenantId: token.tenant_id };
    });
    if (rotation.invalid) throw new HttpError(401, "TOKEN_EXPIRED", "Refresh token is invalid or expired.");
    res.json({
      data: {
        accessToken: signToken({ kind: "user", userId: rotation.userId, tenantId: rotation.tenantId }, jwtSecret),
        refreshToken: nextRefreshToken,
        tokenType: "Bearer",
        expiresIn: 900
      }
    });
  });

  api.post("/auth/logout", async (req, res) => {
    const refreshToken = requireString(req.body?.refreshToken, "refreshToken", 512);
    await db.query(
      `UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now())
       WHERE family_id = (SELECT family_id FROM refresh_tokens WHERE token_hash = $1)`,
      [hashToken(refreshToken)]
    );
    res.status(204).end();
  });

  api.get("/auth/me", authenticateUser, async (req, res) => {
    const result = await db.query(
      `SELECT u.id, u.email, u.display_name, tm.tenant_id, t.name AS tenant_name
       FROM users u JOIN tenant_memberships tm ON tm.user_id = u.id
       JOIN tenants t ON t.id = tm.tenant_id
       WHERE u.id = $1 AND tm.id = $2`,
      [req.auth.userId, req.auth.membershipId]
    );
    res.json({ data: { ...result.rows[0], permissions: req.auth.permissions } });
  });

  api.get("/auth/tenants", authenticateUser, async (req, res) => {
    const result = await db.query(
      `SELECT t.id, t.slug, t.name, t.status
       FROM tenant_memberships tm JOIN tenants t ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       ORDER BY t.name`,
      [req.auth.userId]
    );
    res.json({ data: result.rows });
  });

  api.post("/auth/switch-tenant", authenticateUser, async (req, res) => {
    const tenantId = requireString(req.body?.tenantId, "tenantId");
    if (!UUID_PATTERN.test(tenantId)) throw new HttpError(400, "VALIDATION_ERROR", "tenantId must be a UUID.");
    const result = await db.query(
      `SELECT tm.id FROM tenant_memberships tm JOIN tenants t ON t.id = tm.tenant_id
       WHERE tm.user_id = $1 AND tm.tenant_id = $2 AND tm.status = 'active' AND t.status = 'active'`,
      [req.auth.userId, tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "The requested tenant is unavailable.");
    const previousRefreshToken = req.body?.refreshToken;
    if (previousRefreshToken !== undefined &&
        (typeof previousRefreshToken !== "string" || previousRefreshToken.length > 512)) {
      throw new HttpError(400, "VALIDATION_ERROR", "refreshToken must be a valid token string.");
    }
    const refreshToken = randomBytes(48).toString("base64url");
    await inDbTransaction(async (client) => {
      if (previousRefreshToken) {
        await client.query(
          `UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, now())
           WHERE token_hash = $1 AND user_id = $2 AND tenant_id = $3`,
          [hashToken(previousRefreshToken), req.auth.userId, req.auth.tenantId]
        );
      }
      await client.query(
        `INSERT INTO refresh_tokens (user_id, tenant_id, family_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4, now() + interval '30 days')`,
        [req.auth.userId, tenantId, randomUUID(), hashToken(refreshToken)]
      );
    });
    res.json({
      data: {
        accessToken: signToken({ kind: "user", userId: req.auth.userId, tenantId }, jwtSecret),
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 900
      }
    });
  });

  api.get("/permissions", authenticateUser, requirePermission("roles.read"), async (req, res) => {
    const result = await db.query("SELECT code, description FROM permissions ORDER BY code");
    res.json({ data: result.rows });
  });

  api.get("/roles", authenticateUser, requirePermission("roles.read"), async (req, res) => {
    const result = await db.query(
      `SELECT r.id, r.name, r.description, r.is_system AS "isSystem",
              COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::text[]) AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE r.tenant_id = $1
       GROUP BY r.id ORDER BY r.name`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.post("/roles", authenticateUser, requirePermission("roles.manage", { mutable: true }), async (req, res) => {
    const name = requireString(req.body?.name, "name", 80);
    const description = typeof req.body?.description === "string" ? req.body.description.slice(0, 500) : "";
    const codes = req.body?.permissions;
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 40 ||
        codes.some((code) => typeof code !== "string")) {
      throw new HttpError(400, "VALIDATION_ERROR", "permissions must be a non-empty list of permission codes.");
    }
    const uniqueCodes = [...new Set(codes)];
    const created = await inDbTransaction(async (client) => {
      const permissionRows = await client.query(
        "SELECT id, code FROM permissions WHERE code = ANY($1::text[])",
        [uniqueCodes]
      );
      if (permissionRows.rowCount !== uniqueCodes.length) {
        throw new HttpError(400, "VALIDATION_ERROR", "One or more permission codes are unknown.");
      }
      const role = await client.query(
        `INSERT INTO roles (tenant_id, name, description, is_system)
         VALUES ($1, $2, $3, false) RETURNING id, name, description`,
        [req.auth.tenantId, name, description]
      );
      for (const permission of permissionRows.rows) {
        await client.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [role.rows[0].id, permission.id]
        );
      }
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "role.created", "role", role.rows[0].id);
      return { ...role.rows[0], permissions: uniqueCodes };
    });
    res.status(201).json({ data: created });
  });

  api.patch("/roles/:id", authenticateUser, requirePermission("roles.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Role id must be a UUID.");
    const name = req.body?.name === undefined ? null : requireString(req.body.name, "name", 80);
    let description = null;
    if (req.body?.description !== undefined) {
      if (typeof req.body.description !== "string" || req.body.description.length > 500) {
        throw new HttpError(400, "VALIDATION_ERROR", "description must be a string of at most 500 characters.");
      }
      description = req.body.description;
    }
    if (name === null && description === null) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a role name or description to update.");
    }
    const result = await inDbTransaction(async (client) => {
      const role = await client.query(
        `UPDATE roles SET name = COALESCE($3, name), description = COALESCE($4, description)
         WHERE id = $1 AND tenant_id = $2 AND is_system = false
         RETURNING id, name, description`,
        [req.params.id, req.auth.tenantId, name, description]
      );
      if (!role.rowCount) {
        const existing = await client.query(
          "SELECT is_system FROM roles WHERE id = $1 AND tenant_id = $2",
          [req.params.id, req.auth.tenantId]
        );
        if (!existing.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Role not found.");
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "System roles cannot be modified.");
      }
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "role.updated", "role", req.params.id);
      return role.rows[0];
    });
    res.json({ data: result });
  });

  api.put("/roles/:id/permissions", authenticateUser, requirePermission("roles.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Role id must be a UUID.");
    const codes = req.body?.permissions;
    if (!Array.isArray(codes) || codes.length > 40 || codes.some((code) => typeof code !== "string")) {
      throw new HttpError(400, "VALIDATION_ERROR", "permissions must be a list of permission codes.");
    }
    const uniqueCodes = [...new Set(codes)];
    const result = await inDbTransaction(async (client) => {
      const role = await client.query(
        "SELECT id, is_system FROM roles WHERE id = $1 AND tenant_id = $2 FOR UPDATE",
        [req.params.id, req.auth.tenantId]
      );
      if (!role.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Role not found.");
      if (role.rows[0].is_system) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "System roles cannot be modified.");
      const permissionsResult = await client.query(
        "SELECT id, code FROM permissions WHERE code = ANY($1::text[])",
        [uniqueCodes]
      );
      if (permissionsResult.rowCount !== uniqueCodes.length) {
        throw new HttpError(400, "VALIDATION_ERROR", "One or more permission codes are unknown.");
      }
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [req.params.id]);
      for (const permission of permissionsResult.rows) {
        await client.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
          [req.params.id, permission.id]
        );
      }
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "role.permissions_updated", "role", req.params.id);
      return { id: req.params.id, permissions: uniqueCodes };
    });
    res.json({ data: result });
  });

  api.delete("/roles/:id", authenticateUser, requirePermission("roles.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Role id must be a UUID.");
    await inDbTransaction(async (client) => {
      const role = await client.query(
        "SELECT id, is_system FROM roles WHERE id = $1 AND tenant_id = $2 FOR UPDATE",
        [req.params.id, req.auth.tenantId]
      );
      if (!role.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Role not found.");
      if (role.rows[0].is_system) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "System roles cannot be deleted.");
      const assigned = await client.query(
        "SELECT 1 FROM membership_roles WHERE role_id = $1 LIMIT 1",
        [req.params.id]
      );
      if (assigned.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Remove this role from all memberships before deleting it.");
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [req.params.id]);
      await client.query("DELETE FROM roles WHERE id = $1", [req.params.id]);
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "role.deleted", "role", req.params.id);
    });
    res.status(204).end();
  });

  api.get("/members", authenticateUser, requirePermission("members.read"), async (req, res) => {
    const result = await db.query(
      `SELECT tm.id AS "membershipId", u.id AS "userId", u.email, u.display_name AS "displayName",
              tm.status, tm.joined_at AS "joinedAt",
              COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles
       FROM tenant_memberships tm JOIN users u ON u.id = tm.user_id
       LEFT JOIN membership_roles mr ON mr.membership_id = tm.id AND mr.tenant_id = tm.tenant_id
       LEFT JOIN roles r ON r.id = mr.role_id AND r.tenant_id = mr.tenant_id
       WHERE tm.tenant_id = $1 GROUP BY tm.id, u.id ORDER BY u.email`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.post("/members", authenticateUser, requirePermission("members.manage", { mutable: true }), async (req, res) => {
    const email = requireString(req.body?.email, "email", 320).toLowerCase();
    const displayName = requireString(req.body?.displayName, "displayName", 160);
    const password = req.body?.password;
    const roleIds = req.body?.roleIds;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        (password !== undefined && (typeof password !== "string" || password.length < 12 || password.length > 1024)) ||
        !Array.isArray(roleIds) || roleIds.length < 1 || roleIds.length > 20 ||
        roleIds.some((id) => !UUID_PATTERN.test(id))) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a valid email, an optional password of at least 12 characters, and one or more role IDs.");
    }
    const uniqueRoleIds = [...new Set(roleIds)];
    const member = await inDbTransaction(async (client) => {
      const roles = await client.query(
        "SELECT id FROM roles WHERE tenant_id = $1 AND id = ANY($2::uuid[])",
        [req.auth.tenantId, uniqueRoleIds]
      );
      if (roles.rowCount !== uniqueRoleIds.length) throw new HttpError(400, "VALIDATION_ERROR", "One or more roles are unavailable in this tenant.");
      const existingUser = await client.query(
        "SELECT id, email, display_name, status FROM users WHERE lower(email) = $1 FOR UPDATE",
        [email]
      );
      let user = existingUser.rows[0];
      if (user && user.status !== "active") {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "A suspended user cannot be added to a tenant.");
      }
      if (!user) {
        if (typeof password !== "string") {
          throw new HttpError(400, "VALIDATION_ERROR", "A password of at least 12 characters is required for a new user.");
        }
        const passwordHash = await hashPassword(password);
        const createdUser = await client.query(
          `INSERT INTO users (email, password_hash, display_name)
           VALUES ($1, $2, $3) RETURNING id, email, display_name`,
          [email, passwordHash, displayName]
        );
        user = createdUser.rows[0];
      }
      const membership = await client.query(
        `INSERT INTO tenant_memberships (tenant_id, user_id)
         VALUES ($1, $2) RETURNING id, status, joined_at`,
        [req.auth.tenantId, user.id]
      );
      for (const role of roles.rows) {
        await client.query(
          `INSERT INTO membership_roles (tenant_id, membership_id, role_id) VALUES ($1, $2, $3)`,
          [req.auth.tenantId, membership.rows[0].id, role.id]
        );
      }
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "member.created", "membership", membership.rows[0].id);
      return {
        membershipId: membership.rows[0].id,
        userId: user.id,
        email: user.email,
        displayName: user.display_name,
        status: membership.rows[0].status,
        joinedAt: membership.rows[0].joined_at
      };
    });
    res.status(201).json({ data: member });
  });

  api.patch("/members/:id", authenticateUser, requirePermission("members.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id) || !["active", "suspended"].includes(req.body?.status)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a valid membership ID and status.");
    }
    const member = await inDbTransaction(async (client) => {
      if (req.body.status === "suspended") {
        await assertLastAdminSafe(client, req.auth.tenantId, req.params.id, false);
      }
      const result = await client.query(
        `UPDATE tenant_memberships SET status = $3
         WHERE id = $1 AND tenant_id = $2
         RETURNING id, user_id AS "userId", status`,
        [req.params.id, req.auth.tenantId, req.body.status]
      );
      if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Membership not found.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "member.status_updated", "membership", req.params.id, { status: req.body.status });
      return result.rows[0];
    });
    res.json({ data: member });
  });

  api.delete("/members/:id", authenticateUser, requirePermission("members.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Membership id must be a UUID.");
    await inDbTransaction(async (client) => {
      await assertLastAdminSafe(client, req.auth.tenantId, req.params.id, false);
      const result = await client.query(
        `UPDATE tenant_memberships SET status = 'suspended'
         WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, req.auth.tenantId]
      );
      if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Membership not found.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "member.suspended", "membership", req.params.id);
    });
    res.status(204).end();
  });

  api.put("/members/:id/roles", authenticateUser, requirePermission("members.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id) || !Array.isArray(req.body?.roleIds) ||
        req.body.roleIds.length > 20 || req.body.roleIds.some((id) => !UUID_PATTERN.test(id))) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a valid membership ID and roleIds list.");
    }
    const roleIds = [...new Set(req.body.roleIds)];
    const result = await inDbTransaction(async (client) => {
      const membership = await client.query(
        `SELECT id FROM tenant_memberships WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.id, req.auth.tenantId]
      );
      if (!membership.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Membership not found.");
      const roles = await client.query(
        `SELECT id, lower(name) = 'tenant_admin' AS is_admin
         FROM roles WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
        [req.auth.tenantId, roleIds]
      );
      if (roles.rowCount !== roleIds.length) throw new HttpError(400, "VALIDATION_ERROR", "One or more roles are unavailable in this tenant.");
      const remainsAdmin = roles.rows.some((role) => role.is_admin);
      await assertLastAdminSafe(client, req.auth.tenantId, req.params.id, remainsAdmin);
      await client.query("DELETE FROM membership_roles WHERE membership_id = $1", [req.params.id]);
      for (const role of roles.rows) {
        await client.query(
          `INSERT INTO membership_roles (tenant_id, membership_id, role_id) VALUES ($1, $2, $3)`,
          [req.auth.tenantId, req.params.id, role.id]
        );
      }
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "member.roles_updated", "membership", req.params.id);
      return { membershipId: req.params.id, roleIds };
    });
    res.json({ data: result });
  });

  api.get("/public/machines/:publicCode", async (req, res) => {
    const result = await db.query(
      `SELECT vm.public_code, vm.name, vm.status, l.name AS location_name, t.status AS tenant_status
       FROM vending_machines vm
       JOIN tenants t ON t.id = vm.tenant_id
       JOIN locations l ON l.id = vm.location_id AND l.tenant_id = vm.tenant_id
       WHERE vm.public_code = $1`,
      [req.params.publicCode]
    );
    const machine = result.rows[0];
    if (!machine) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
    if (machine.tenant_status !== "active") throw new HttpError(409, "TENANT_NOT_ACTIVE", "This tenant does not accept purchases.");
    if (machine.status !== "active") throw new HttpError(409, "MACHINE_NOT_ACTIVE", "This machine does not accept purchases.");
    res.json({ data: { publicCode: machine.public_code, name: machine.name, locationName: machine.location_name, status: machine.status } });
  });

  api.get("/public/machines/:publicCode/qr", async (req, res) => {
    const result = await db.query(
      `SELECT vm.public_code, vm.status, t.status AS tenant_status
       FROM vending_machines vm JOIN tenants t ON t.id = vm.tenant_id
       WHERE vm.public_code = $1`,
      [req.params.publicCode]
    );
    const machine = result.rows[0];
    if (!machine) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
    if (machine.status !== "active" || machine.tenant_status !== "active") {
      throw new HttpError(409, "MACHINE_NOT_ACTIVE", "A QR code is unavailable for an inactive machine.");
    }
    const target = `${config.publicBaseUrl}/buy?machine=${encodeURIComponent(machine.public_code)}`;
    const svg = await QRCode.toString(target, { type: "svg", margin: 1, width: 280, errorCorrectionLevel: "M" });
    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=300");
    res.send(svg);
  });

  api.get("/public/machines/:publicCode/catalog", async (req, res) => {
    const machine = await db.query(
      `SELECT vm.id, vm.tenant_id, vm.name, vm.status, t.status AS tenant_status
       FROM vending_machines vm JOIN tenants t ON t.id = vm.tenant_id
       WHERE vm.public_code = $1`,
      [req.params.publicCode]
    );
    const current = machine.rows[0];
    if (!current) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
    if (current.tenant_status !== "active") throw new HttpError(409, "TENANT_NOT_ACTIVE", "This tenant does not accept purchases.");
    if (current.status !== "active") throw new HttpError(409, "MACHINE_NOT_ACTIVE", "This machine does not accept purchases.");
    const result = await db.query(
      `SELECT s.id AS slot_id, s.position, s.on_hand, s.reserved,
              p.id AS product_id, p.sku, p.name, p.description, p.currency, p.image_url,
              COALESCE(s.price_override_minor, p.price_minor) AS price_minor,
              GREATEST(0, s.on_hand - s.reserved) AS available
       FROM machine_slots s JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
       WHERE s.machine_id = $1 AND s.tenant_id = $2 AND s.status = 'active' AND p.status = 'active'
       ORDER BY s.position`,
      [current.id, current.tenant_id]
    );
    res.json({
      data: {
        machine: { publicCode: req.params.publicCode, name: current.name },
        items: result.rows.map((item) => ({
          slotId: item.slot_id,
          position: item.position,
          product: {
            id: item.product_id,
            sku: item.sku,
            name: item.name,
            description: item.description,
            currency: item.currency,
            imageUrl: item.image_url
          },
          priceMinor: item.price_minor,
          available: item.available
        }))
      }
    });
  });

  api.post("/public/machines/:publicCode/orders", async (req, res) => {
    const key = requireString(req.get("idempotency-key"), "Idempotency-Key", 200);
    const items = normalizeItems(req.body?.items);
    const requestHash = stableHash(items);
    const machineLookup = await db.query(
      `SELECT vm.id, vm.tenant_id, vm.status, t.status AS tenant_status
       FROM vending_machines vm JOIN tenants t ON t.id = vm.tenant_id
       WHERE vm.public_code = $1`,
      [req.params.publicCode]
    );
    const machine = machineLookup.rows[0];
    if (!machine) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
    if (machine.tenant_status !== "active") throw new HttpError(409, "TENANT_NOT_ACTIVE", "This tenant does not accept purchases.");
    if (machine.status !== "active") throw new HttpError(409, "MACHINE_NOT_ACTIVE", "This machine does not accept purchases.");

    const response = await inDbTransaction(async (client) => {
      const idempotency = await startIdempotent(client, machine.tenant_id, "public-order", key, requestHash);
      if (idempotency.replay) return idempotency;

      const slotRows = [];
      for (const item of items) {
        const slot = await client.query(
          `SELECT s.id, s.machine_id, s.tenant_id, s.product_id, s.on_hand, s.reserved,
                  s.price_override_minor, p.name AS product_name, p.sku, p.price_minor,
                  p.currency, p.status AS product_status
           FROM machine_slots s JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
           WHERE s.id = $1 AND s.machine_id = $2 AND s.tenant_id = $3
             AND s.status = 'active'
           FOR UPDATE OF s`,
          [item.slotId, machine.id, machine.tenant_id]
        );
        const row = slot.rows[0];
        if (!row || row.product_status !== "active") {
          throw new HttpError(404, "RESOURCE_NOT_FOUND", "A requested catalog item is unavailable.");
        }
        if (row.on_hand - row.reserved < item.quantity) {
          throw new HttpError(409, "INSUFFICIENT_STOCK", "The requested quantity is not available.");
        }
        slotRows.push({ ...row, quantity: item.quantity, unitPrice: row.price_override_minor ?? row.price_minor });
      }
      const currency = slotRows[0].currency;
      if (slotRows.some((slot) => slot.currency !== currency)) {
        throw new HttpError(409, "VALIDATION_ERROR", "All items in an order must use the same currency.");
      }
      const subtotal = slotRows.reduce((sum, slot) => sum + slot.unitPrice * slot.quantity, 0);
      if (!Number.isSafeInteger(subtotal) || subtotal > 2_000_000_000) {
        throw new HttpError(400, "VALIDATION_ERROR", "The order total exceeds the supported limit.");
      }
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const publicToken = derivePublicOrderToken(machine.tenant_id, key, requestHash, jwtSecret);
      const order = await client.query(
        `INSERT INTO orders
           (tenant_id, machine_id, public_token_hash, status, currency, subtotal_minor, total_minor, reservation_expires_at)
         VALUES ($1, $2, $3, 'awaiting_payment', $4, $5, $5, $6)
         RETURNING id, status, currency, subtotal_minor, total_minor, reservation_expires_at`,
        [machine.tenant_id, machine.id, hashToken(publicToken), currency, subtotal, expiresAt]
      );
      const created = order.rows[0];
      const responseItems = [];
      for (const slot of slotRows) {
        const lineTotal = slot.unitPrice * slot.quantity;
        await client.query(
          `INSERT INTO order_items
             (tenant_id, order_id, product_id, slot_id, quantity, unit_price_minor, total_minor, product_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [machine.tenant_id, created.id, slot.product_id, slot.id, slot.quantity, slot.unitPrice, lineTotal,
            { sku: slot.sku, name: slot.product_name }]
        );
        await client.query(
          `INSERT INTO inventory_reservations
             (tenant_id, order_id, slot_id, quantity, status, expires_at)
           VALUES ($1, $2, $3, $4, 'active', $5)`,
          [machine.tenant_id, created.id, slot.id, slot.quantity, expiresAt]
        );
        await client.query(
          "UPDATE machine_slots SET reserved = reserved + $2, updated_at = now() WHERE id = $1",
          [slot.id, slot.quantity]
        );
        responseItems.push({
          slotId: slot.id,
          name: slot.product_name,
          quantity: slot.quantity,
          unitPriceMinor: slot.unitPrice,
          totalMinor: lineTotal
        });
      }
      const body = {
        order: {
          id: created.id,
          status: created.status,
          currency: created.currency,
          subtotalMinor: created.subtotal_minor,
          totalMinor: created.total_minor,
          reservationExpiresAt: created.reservation_expires_at,
          items: responseItems
        }
      };
      await finishIdempotent(client, machine.tenant_id, "public-order", key, 201, body);
      await addAudit(client, req, machine.tenant_id, "system", null, "order.created", "order", created.id);
      return { replay: false, status: 201, body, publicToken };
    });
    const publicToken = response.publicToken ?? derivePublicOrderToken(machine.tenant_id, key, requestHash, jwtSecret);
    res.status(response.status).json({
      data: {
        ...response.body,
        id: response.body.order.id,
        orderId: response.body.order.id,
        publicToken
      }
    });
  });

  api.get("/public/orders/:publicToken", async (req, res) => {
    const tokenHash = hashToken(req.params.publicToken);
    const result = await db.query(
      `SELECT o.id, o.status, o.currency, o.subtotal_minor, o.total_minor,
              o.reservation_expires_at, o.created_at, vm.public_code,
              p.status AS payment_status, j.id AS dispense_job_id, j.status AS dispense_status
       FROM orders o JOIN vending_machines vm ON vm.id = o.machine_id AND vm.tenant_id = o.tenant_id
       LEFT JOIN LATERAL (
         SELECT status FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1
       ) p ON true
       LEFT JOIN dispense_jobs j ON j.order_id = o.id
       WHERE o.public_token_hash = $1`,
      [tokenHash]
    );
    const order = result.rows[0];
    if (!order) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Order not found.");
    const items = await db.query(
      `SELECT product_snapshot, quantity, unit_price_minor, total_minor
       FROM order_items WHERE order_id = $1 ORDER BY id`,
      [order.id]
    );
    res.json({
      data: {
        id: order.id,
        status: order.status,
        currency: order.currency,
        subtotalMinor: order.subtotal_minor,
        totalMinor: order.total_minor,
        reservationExpiresAt: order.reservation_expires_at,
        createdAt: order.created_at,
        publicCode: order.public_code,
        paymentStatus: order.payment_status,
        dispenseJob: order.dispense_job_id ? { id: order.dispense_job_id, status: order.dispense_status } : null,
        items: items.rows.map((item) => ({
          product: item.product_snapshot,
          quantity: item.quantity,
          unitPriceMinor: item.unit_price_minor,
          totalMinor: item.total_minor
        }))
      }
    });
  });

  api.post("/public/orders/:publicToken/payments/simulate", async (req, res) => {
    const key = requireString(req.get("idempotency-key"), "Idempotency-Key", 200);
    const outcome = req.body?.outcome;
    if (!["approved", "declined", "timeout"].includes(outcome)) {
      throw new HttpError(400, "VALIDATION_ERROR", "outcome must be approved, declined, or timeout.");
    }
    const requestHash = stableHash({ orderTokenHash: hashToken(req.params.publicToken), outcome });
    const result = await inDbTransaction(async (client) => {
      const orderLookup = await client.query(
        `SELECT id, tenant_id FROM orders WHERE public_token_hash = $1`,
        [hashToken(req.params.publicToken)]
      );
      const orderId = orderLookup.rows[0]?.id;
      const tenantId = orderLookup.rows[0]?.tenant_id;
      if (!orderId) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Order not found.");
      const idempotency = await startIdempotent(client, tenantId, "payment-simulation", key, requestHash);
      if (idempotency.replay) return idempotency;
      const currentResult = await client.query(
        `SELECT o.*, t.status AS tenant_status
         FROM orders o JOIN tenants t ON t.id = o.tenant_id
         WHERE o.id = $1 FOR UPDATE OF o`,
        [orderId]
      );
      const order = currentResult.rows[0];
      if (order.tenant_status !== "active") throw new HttpError(409, "TENANT_NOT_ACTIVE", "This tenant does not accept purchases.");
      if (order.status !== "awaiting_payment") {
        throw new HttpError(409, "ORDER_NOT_PAYABLE", "This order does not accept payment.");
      }
      if (new Date(order.reservation_expires_at).getTime() <= Date.now()) {
        throw new HttpError(409, "RESERVATION_EXPIRED", "The order reservation has expired.");
      }
      const paymentStatus = outcome === "approved" ? "approved" : outcome;
      const payment = await client.query(
        `INSERT INTO payments
           (tenant_id, order_id, external_reference, status, amount_minor, currency, scenario,
            failure_code, approved_at)
         VALUES ($1::uuid, $2::uuid, $3::text, $4::text, $5::integer, $6::char(3),
                 $7::text, $8::text, CASE WHEN $4::text = 'approved' THEN now() END)
         RETURNING id, status, amount_minor, currency`,
        [tenantId, orderId, createHash("sha256").update(`${tenantId}:${key}`).digest("hex"),
          paymentStatus, order.total_minor, order.currency, outcome,
          outcome === "declined" ? "SIMULATED_DECLINE" : null]
      );
      if (outcome === "approved") {
        await client.query(
          `UPDATE orders SET status = 'paid', reservation_expires_at = now() + interval '10 minutes', updated_at = now()
           WHERE id = $1`,
          [orderId]
        );
        await client.query(
          `UPDATE inventory_reservations SET expires_at = now() + interval '10 minutes'
           WHERE order_id = $1 AND status = 'active'`,
          [orderId]
        );
        await client.query(
          `INSERT INTO dispense_jobs (tenant_id, machine_id, order_id, payload)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (order_id) DO NOTHING`,
          [tenantId, order.machine_id, orderId, { orderId }]
        );
      }
      const body = {
        payment: {
          id: payment.rows[0].id,
          status: payment.rows[0].status,
          amountMinor: payment.rows[0].amount_minor,
          currency: payment.rows[0].currency
        },
        orderStatus: outcome === "approved" ? "paid" : order.status
      };
      await finishIdempotent(client, tenantId, "payment-simulation", key, 200, body);
      await addAudit(client, req, tenantId, "system", null, "payment.simulated", "payment", payment.rows[0].id, { outcome });
      return { replay: false, status: 200, body };
    });
    res.status(result.status).json({
      data: {
        ...result.body,
        id: result.body.payment.id,
        paymentId: result.body.payment.id,
        status: result.body.payment.status
      }
    });
  });

  api.post("/public/orders/:publicToken/cancel", async (req, res) => {
    const tokenHash = hashToken(req.params.publicToken);
    const result = await inDbTransaction(async (client) => {
      const lookup = await client.query(
        "SELECT id, tenant_id, status FROM orders WHERE public_token_hash = $1 FOR UPDATE",
        [tokenHash]
      );
      const order = lookup.rows[0];
      if (!order) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Order not found.");
      if (!["pending", "awaiting_payment", "failed"].includes(order.status)) {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "This order cannot be cancelled.");
      }
      await releaseReservations(client, order.id, "released");
      await client.query(
        "UPDATE orders SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = $1",
        [order.id]
      );
      await addAudit(client, req, order.tenant_id, "system", null, "order.cancelled", "order", order.id);
      return { id: order.id, status: "cancelled" };
    });
    res.json({ data: result });
  });

  api.post("/devices/authenticate", deviceRateLimit, async (req, res) => {
    const publicCode = requireString(req.body?.publicCode, "publicCode");
    const key = requireString(req.body?.deviceKey, "deviceKey", 512);
    const result = await db.query(
      `SELECT vm.id, vm.tenant_id, vm.device_key_hash
       FROM vending_machines vm JOIN tenants t ON t.id = vm.tenant_id
       WHERE vm.public_code = $1 AND vm.status = 'active' AND t.status = 'active'`,
      [publicCode]
    );
    const machine = result.rows[0];
    const providedHash = createHash("sha256").update(key).digest();
    const expectedHash = machine ? Buffer.from(machine.device_key_hash, "hex") : Buffer.alloc(0);
    if (!machine || expectedHash.length !== providedHash.length ||
        !timingSafeEqual(expectedHash, providedHash)) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Device credentials are invalid.");
    }
    res.json({
      data: {
        accessToken: signToken({
          kind: "device",
          machineId: machine.id,
          tenantId: machine.tenant_id
        }, jwtSecret, 3600),
        tokenType: "Bearer",
        expiresIn: 3600
      }
    });
  });

  api.post("/devices/heartbeat", authenticateDevice, async (req, res) => {
    const result = await db.query(
      `UPDATE vending_machines SET last_heartbeat_at = now(), software_version = $2,
         updated_at = now()
       WHERE id = $1 AND status <> 'suspended'
       RETURNING last_heartbeat_at`,
      [req.auth.machineId, typeof req.body?.softwareVersion === "string" ? req.body.softwareVersion.slice(0, 80) : null]
    );
    if (!result.rowCount) throw new HttpError(403, "DEVICE_NOT_AUTHORIZED", "Device is not active.");
    res.json({ data: { lastHeartbeatAt: result.rows[0].last_heartbeat_at } });
  });

  api.get("/devices/jobs/next", authenticateDevice, async (req, res) => {
    const job = await inDbTransaction(async (client) => {
      const result = await client.query(
        `SELECT j.id, j.tenant_id, j.order_id, j.payload
         FROM dispense_jobs j
         JOIN vending_machines vm ON vm.id = j.machine_id AND vm.tenant_id = j.tenant_id
         JOIN tenants t ON t.id = j.tenant_id AND t.status = 'active'
         JOIN orders o ON o.id = j.order_id AND o.tenant_id = j.tenant_id AND o.status = 'paid'
         WHERE j.machine_id = $1 AND j.tenant_id = $2 AND j.status = 'queued'
           AND vm.status = 'active'
         ORDER BY j.created_at
         LIMIT 1
         FOR UPDATE OF j SKIP LOCKED`,
        [req.auth.machineId, req.auth.tenantId]
      );
      if (!result.rowCount) return null;
      const next = result.rows[0];
      await client.query(
        `UPDATE dispense_jobs SET status = 'processing', claimed_at = now(), started_at = now(),
           attempt_count = attempt_count + 1, updated_at = now() WHERE id = $1`,
        [next.id]
      );
      const orderUpdate = await client.query(
        "UPDATE orders SET status = 'dispensing', updated_at = now() WHERE id = $1 AND status = 'paid'",
        [next.order_id]
      );
      if (!orderUpdate.rowCount) throw new HttpError(409, "DISPENSE_JOB_NOT_AVAILABLE", "The order is not ready to dispense.");
      await addAudit(client, req, req.auth.tenantId, "device", req.auth.machineId, "dispense.claimed", "dispense_job", next.id);
      return { id: next.id, orderId: next.order_id, payload: next.payload };
    });
    res.json({ data: job });
  });

  api.post("/devices/jobs/:id/complete", authenticateDevice, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Job id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const query = await client.query(
        `SELECT j.id, j.order_id, j.status, j.tenant_id, j.machine_id
         FROM dispense_jobs j
         WHERE j.id = $1 AND j.machine_id = $2 AND j.tenant_id = $3
         FOR UPDATE`,
        [req.params.id, req.auth.machineId, req.auth.tenantId]
      );
      const job = query.rows[0];
      if (!job) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Job not found.");
      if (job.status === "dispensed") return { id: job.id, status: "dispensed", duplicate: true };
      if (job.status !== "processing") throw new HttpError(409, "DISPENSE_JOB_NOT_AVAILABLE", "Job is not processing.");
      const order = await client.query(
        `SELECT status, total_minor, currency FROM orders
         WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [job.order_id, job.tenant_id]
      );
      if (!order.rowCount || order.rows[0].status !== "dispensing") {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "The order is not in the dispensing state.");
      }
      const approvedPayment = await client.query(
        `SELECT 1 FROM payments
         WHERE order_id = $1 AND tenant_id = $2 AND status = 'approved'
           AND amount_minor = $3 AND currency = $4
         LIMIT 1`,
        [job.order_id, job.tenant_id, order.rows[0].total_minor, order.rows[0].currency]
      );
      if (!approvedPayment.rowCount) {
        throw new HttpError(409, "ORDER_NOT_PAYABLE", "The order has no matching approved payment.");
      }
      const reservations = await client.query(
        `SELECT id, slot_id, quantity FROM inventory_reservations
         WHERE order_id = $1 AND tenant_id = $2 AND status = 'active'
         ORDER BY slot_id FOR UPDATE`,
        [job.order_id, job.tenant_id]
      );
      if (!reservations.rowCount) throw new HttpError(409, "RESERVATION_EXPIRED", "The order has no active inventory reservation.");
      for (const reservation of reservations.rows) {
        const update = await client.query(
          `UPDATE machine_slots
           SET on_hand = on_hand - $2, reserved = reserved - $2, updated_at = now()
           WHERE id = $1 AND on_hand >= $2 AND reserved >= $2
           RETURNING product_id`,
          [reservation.slot_id, reservation.quantity]
        );
        if (!update.rowCount) throw new HttpError(409, "INSUFFICIENT_STOCK", "Reserved stock is inconsistent.");
        await client.query(
          `UPDATE inventory_reservations SET status = 'consumed', consumed_at = now() WHERE id = $1`,
          [reservation.id]
        );
        await client.query(
          `INSERT INTO inventory_movements
             (tenant_id, machine_id, slot_id, product_id, type, quantity_delta, reason,
              reference_type, reference_id, actor_type, actor_id)
           VALUES ($1, $2, $3, $4, 'sale', $5, 'Confirmed vending dispatch', 'order', $6, 'device', $7)`,
          [job.tenant_id, job.machine_id, reservation.slot_id, update.rows[0].product_id,
            -reservation.quantity, job.order_id, job.machine_id]
        );
      }
      await client.query(
        "UPDATE dispense_jobs SET status = 'dispensed', completed_at = now(), updated_at = now() WHERE id = $1",
        [job.id]
      );
      await client.query(
        "UPDATE orders SET status = 'completed', completed_at = now(), updated_at = now() WHERE id = $1",
        [job.order_id]
      );
      await addAudit(client, req, job.tenant_id, "device", job.machine_id, "dispense.completed", "dispense_job", job.id);
      return { id: job.id, status: "dispensed", duplicate: false };
    });
    res.json({ data: result });
  });

  api.post("/devices/jobs/:id/fail", authenticateDevice, async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Job id must be a UUID.");
    const failureCode = typeof req.body?.failureCode === "string" && /^[A-Z0-9_-]{1,60}$/.test(req.body.failureCode)
      ? req.body.failureCode
      : "DEVICE_FAILURE";
    const result = await inDbTransaction(async (client) => {
      const query = await client.query(
        `SELECT id, order_id, tenant_id, machine_id, status, attempt_count
         FROM dispense_jobs WHERE id = $1 AND machine_id = $2 AND tenant_id = $3 FOR UPDATE`,
        [req.params.id, req.auth.machineId, req.auth.tenantId]
      );
      const job = query.rows[0];
      if (!job) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Job not found.");
      if (job.status === "failed") return { id: job.id, status: "failed", duplicate: true };
      if (job.status !== "processing") throw new HttpError(409, "DISPENSE_JOB_NOT_AVAILABLE", "Job is not processing.");
      await client.query(
        `UPDATE dispense_jobs
         SET status = 'failed', failed_at = now(), failure_code = $2, updated_at = now()
         WHERE id = $1`,
        [job.id, failureCode]
      );
      await client.query(
        "UPDATE orders SET status = 'failed', updated_at = now() WHERE id = $1",
        [job.order_id]
      );
      await client.query(
        `UPDATE inventory_reservations SET expires_at = now() + interval '10 minutes'
         WHERE order_id = $1 AND status = 'active'`,
        [job.order_id]
      );
      await addAudit(client, req, job.tenant_id, "device", job.machine_id, "dispense.failed", "dispense_job", job.id, { failureCode });
      return { id: job.id, status: "failed", duplicate: false };
    });
    res.json({ data: result });
  });

  api.get("/machines", authenticateUser, requirePermission("machines.read"), async (req, res) => {
    const result = await db.query(
      `SELECT id, code, public_code AS "publicCode", name, status, last_heartbeat_at AS "lastHeartbeatAt"
       FROM vending_machines WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.get("/locations", authenticateUser, requirePermission("locations.read"), async (req, res) => {
    const result = await db.query(
      `SELECT id, code, name, address, timezone, status
       FROM locations WHERE tenant_id = $1 ORDER BY name`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.post("/locations", authenticateUser, requirePermission("locations.manage", { mutable: true }), async (req, res) => {
    const code = requireString(req.body?.code, "code", 40);
    const name = requireString(req.body?.name, "name", 160);
    const timezone = typeof req.body?.timezone === "string" && req.body.timezone.length <= 80
      ? req.body.timezone
      : "UTC";
    const address = req.body?.address && typeof req.body.address === "object" && !Array.isArray(req.body.address)
      ? req.body.address
      : {};
    const location = await inDbTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO locations (tenant_id, code, name, address, timezone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code, name, address, timezone, status`,
        [req.auth.tenantId, code, name, address, timezone]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "location.created", "location", result.rows[0].id);
      return result.rows[0];
    });
    res.status(201).json({ data: location });
  });

  api.get("/locations/:id", authenticateUser, requirePermission("locations.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Location id must be a UUID.");
    const result = await db.query(
      `SELECT id, code, name, address, timezone, status
       FROM locations WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Location not found.");
    res.json({ data: result.rows[0] });
  });

  api.patch("/locations/:id", authenticateUser, requirePermission("locations.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Location id must be a UUID.");
    const code = req.body?.code === undefined ? null : requireString(req.body.code, "code", 40);
    const name = req.body?.name === undefined ? null : requireString(req.body.name, "name", 160);
    const timezone = req.body?.timezone === undefined ? null : requireString(req.body.timezone, "timezone", 80);
    const address = req.body?.address === undefined ? null : req.body.address;
    if (address !== null && (!address || typeof address !== "object" || Array.isArray(address))) {
      throw new HttpError(400, "VALIDATION_ERROR", "address must be a JSON object.");
    }
    if (code === null && name === null && timezone === null && address === null) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a location field to update.");
    }
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE locations SET code = COALESCE($3, code), name = COALESCE($4, name),
           timezone = COALESCE($5, timezone), address = COALESCE($6::jsonb, address), updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'
         RETURNING id, code, name, address, timezone, status`,
        [req.params.id, req.auth.tenantId, code, name, timezone, address]
      );
      if (!updated.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Location not found.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "location.updated", "location", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/locations/:id/archive", authenticateUser, requirePermission("locations.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Location id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const location = await client.query(
        `UPDATE locations SET status = 'archived', updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'
         RETURNING id, status`,
        [req.params.id, req.auth.tenantId]
      );
      if (!location.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Location not found.");
      const machines = await client.query(
        `UPDATE vending_machines SET status = 'suspended', updated_at = now()
         WHERE location_id = $1 AND tenant_id = $2 AND status <> 'suspended'`,
        [req.params.id, req.auth.tenantId]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "location.archived", "location", req.params.id, { suspendedMachines: machines.rowCount });
      return location.rows[0];
    });
    res.json({ data: result });
  });

  api.get("/machines/:id", authenticateUser, requirePermission("machines.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const result = await db.query(
      `SELECT id, tenant_id, location_id, code, public_code AS "publicCode",
              name, status, last_heartbeat_at AS "lastHeartbeatAt", software_version AS "softwareVersion"
       FROM vending_machines WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
    res.json({ data: result.rows[0] });
  });

  api.post("/machines", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    const locationId = requireString(req.body?.locationId, "locationId");
    const code = requireString(req.body?.code, "code", 40);
    const name = requireString(req.body?.name, "name", 160);
    if (!UUID_PATTERN.test(locationId)) throw new HttpError(400, "VALIDATION_ERROR", "locationId must be a UUID.");
    const publicCode = randomBytes(16).toString("base64url");
    const deviceKey = randomBytes(48).toString("base64url");
    const deviceKeyHash = createHash("sha256").update(deviceKey).digest("hex");
    const machine = await inDbTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO vending_machines
           (tenant_id, location_id, code, public_code, name, device_key_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, code, public_code AS "publicCode", name, status`,
        [req.auth.tenantId, locationId, code, publicCode, name, deviceKeyHash]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.created", "machine", result.rows[0].id);
      return result.rows[0];
    });
    res.status(201).json({ data: { ...machine, deviceKey } });
  });

  api.patch("/machines/:id", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const code = req.body?.code === undefined ? null : requireString(req.body.code, "code", 40);
    const name = req.body?.name === undefined ? null : requireString(req.body.name, "name", 160);
    const locationId = req.body?.locationId === undefined ? null : requireString(req.body.locationId, "locationId");
    if (locationId !== null && !UUID_PATTERN.test(locationId)) {
      throw new HttpError(400, "VALIDATION_ERROR", "locationId must be a UUID.");
    }
    if (code === null && name === null && locationId === null) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide a machine field to update.");
    }
    const result = await inDbTransaction(async (client) => {
      if (locationId !== null) {
        const location = await client.query(
          "SELECT 1 FROM locations WHERE id = $1 AND tenant_id = $2 AND status = 'active'",
          [locationId, req.auth.tenantId]
        );
        if (!location.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Location not found.");
      }
      const updated = await client.query(
        `UPDATE vending_machines SET code = COALESCE($3, code), name = COALESCE($4, name),
           location_id = COALESCE($5::uuid, location_id), updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status <> 'suspended'
         RETURNING id, code, public_code AS "publicCode", name, location_id AS "locationId", status`,
        [req.params.id, req.auth.tenantId, code, name, locationId]
      );
      if (!updated.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.updated", "machine", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/machines/:id/maintenance", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE vending_machines SET status = 'maintenance', updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status IN ('active', 'offline')
         RETURNING id, status`,
        [req.params.id, req.auth.tenantId]
      );
      if (!updated.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Machine cannot enter maintenance from its current state.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.maintenance", "machine", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/machines/:id/activate", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE vending_machines SET status = 'active', updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status IN ('offline', 'maintenance')
         RETURNING id, status`,
        [req.params.id, req.auth.tenantId]
      );
      if (!updated.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Machine cannot be activated from its current state.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.activated", "machine", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/machines/:id/suspend", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE vending_machines SET status = 'suspended', updated_at = now()
         WHERE id = $1 AND tenant_id = $2 AND status <> 'suspended'
         RETURNING id, status`,
        [req.params.id, req.auth.tenantId]
      );
      if (!updated.rowCount) throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Machine cannot be suspended from its current state.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.suspended", "machine", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.post("/machines/:id/device-key/rotate", authenticateUser, requirePermission("machines.credentials.rotate", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const deviceKey = randomBytes(48).toString("base64url");
    const result = await inDbTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE vending_machines
         SET device_key_hash = $3, device_key_version = device_key_version + 1, updated_at = now()
         WHERE id = $1 AND tenant_id = $2 RETURNING id, device_key_version AS "deviceKeyVersion"`,
        [req.params.id, req.auth.tenantId, createHash("sha256").update(deviceKey).digest("hex")]
      );
      if (!updated.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine.device_key_rotated", "machine", req.params.id);
      return updated.rows[0];
    });
    res.json({ data: { ...result, deviceKey } });
  });

  api.get("/machines/:id/slots", authenticateUser, requirePermission("machines.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const result = await db.query(
      `SELECT s.id, s.position, s.product_id AS "productId", s.capacity,
              s.on_hand AS "onHand", s.reserved, s.price_override_minor AS "priceOverrideMinor",
              s.status, p.name AS "productName"
       FROM machine_slots s LEFT JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
       WHERE s.machine_id = $1 AND s.tenant_id = $2 ORDER BY s.position`,
      [req.params.id, req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.post("/machines/:id/slots", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const position = requireString(req.body?.position, "position", 40);
    const productId = req.body?.productId ?? null;
    const capacity = req.body?.capacity;
    const priceOverrideMinor = req.body?.priceOverrideMinor ?? null;
    if ((productId !== null && (typeof productId !== "string" || !UUID_PATTERN.test(productId))) ||
        !Number.isSafeInteger(capacity) || capacity < 0 ||
        (priceOverrideMinor !== null && (!Number.isSafeInteger(priceOverrideMinor) || priceOverrideMinor < 0))) {
      throw new HttpError(400, "VALIDATION_ERROR", "Slot product, capacity, or price is invalid.");
    }
    const result = await inDbTransaction(async (client) => {
      const machine = await client.query(
        "SELECT 1 FROM vending_machines WHERE id = $1 AND tenant_id = $2",
        [req.params.id, req.auth.tenantId]
      );
      if (!machine.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Machine not found.");
      if (productId !== null) {
        const product = await client.query(
          "SELECT 1 FROM products WHERE id = $1 AND tenant_id = $2 AND status = 'active'",
          [productId, req.auth.tenantId]
        );
        if (!product.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Product not found.");
      }
      const slot = await client.query(
        `INSERT INTO machine_slots
           (tenant_id, machine_id, product_id, position, capacity, price_override_minor)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, position, product_id AS "productId", capacity, on_hand AS "onHand",
                   reserved, price_override_minor AS "priceOverrideMinor", status`,
        [req.auth.tenantId, req.params.id, productId, position, capacity, priceOverrideMinor]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine_slot.created", "machine_slot", slot.rows[0].id);
      return slot.rows[0];
    });
    res.status(201).json({ data: result });
  });

  api.put("/machines/:id/slots/:slotId", authenticateUser, requirePermission("machines.manage", { mutable: true }), async (req, res) => {
    const { id: machineId, slotId } = req.params;
    if (!UUID_PATTERN.test(machineId) || !UUID_PATTERN.test(slotId)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Machine and slot IDs must be UUIDs.");
    }
    const productId = req.body?.productId ?? null;
    const capacity = req.body?.capacity;
    const priceOverrideMinor = req.body?.priceOverrideMinor ?? null;
    const position = requireString(req.body?.position, "position", 40);
    const status = req.body?.status ?? "active";
    if ((productId !== null && !UUID_PATTERN.test(productId)) ||
        !Number.isSafeInteger(capacity) || capacity < 0 ||
        (priceOverrideMinor !== null && (!Number.isSafeInteger(priceOverrideMinor) || priceOverrideMinor < 0)) ||
        !["active", "inactive"].includes(status)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Slot product, capacity, price, or status is invalid.");
    }
    const result = await inDbTransaction(async (client) => {
      const slot = await client.query(
        `SELECT id, on_hand, reserved FROM machine_slots
         WHERE id = $1 AND machine_id = $2 AND tenant_id = $3 FOR UPDATE`,
        [slotId, machineId, req.auth.tenantId]
      );
      const current = slot.rows[0];
      if (!current) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Slot not found.");
      if (capacity < current.on_hand || (status === "inactive" && current.reserved > 0)) {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "Capacity cannot be below current stock and a reserved slot cannot be disabled.");
      }
      if (productId) {
        const product = await client.query(
          `SELECT 1 FROM products WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
          [productId, req.auth.tenantId]
        );
        if (!product.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Product not found.");
      }
      const updated = await client.query(
        `UPDATE machine_slots
         SET product_id = $4, position = $5, capacity = $6,
             price_override_minor = $7, status = $8, updated_at = now()
         WHERE id = $1 AND machine_id = $2 AND tenant_id = $3
         RETURNING id, position, product_id AS "productId", capacity, on_hand AS "onHand",
                   reserved, price_override_minor AS "priceOverrideMinor", status`,
        [slotId, machineId, req.auth.tenantId, productId, position, capacity, priceOverrideMinor, status]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "machine_slot.updated", "machine_slot", slotId);
      return updated.rows[0];
    });
    res.json({ data: result });
  });

  api.get("/products/:id", authenticateUser, requirePermission("products.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Product id must be a UUID.");
    const result = await db.query(
      `SELECT id, sku, name, description, price_minor AS "priceMinor", currency, image_url AS "imageUrl", status
       FROM products WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Product not found.");
    res.json({ data: result.rows[0] });
  });

  api.post("/products", authenticateUser, requirePermission("products.manage", { mutable: true }), async (req, res) => {
    const sku = requireString(req.body?.sku, "sku", 80);
    const name = requireString(req.body?.name, "name", 160);
    const description = typeof req.body?.description === "string" ? req.body.description.slice(0, 2000) : "";
    const priceMinor = req.body?.priceMinor;
    const currency = typeof req.body?.currency === "string" ? req.body.currency.toUpperCase() : "USD";
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0 || !/^[A-Z]{3}$/.test(currency)) {
      throw new HttpError(400, "VALIDATION_ERROR", "priceMinor must be nonnegative and currency must be a three-letter code.");
    }
    const result = await db.query(
      `INSERT INTO products (tenant_id, sku, name, description, price_minor, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, sku, name, description, price_minor AS "priceMinor", currency, status`,
      [req.auth.tenantId, sku, name, description, priceMinor, currency]
    );
    await addAudit(db, req, req.auth.tenantId, "user", req.auth.userId, "product.created", "product", result.rows[0].id);
    res.status(201).json({ data: result.rows[0] });
  });

  api.patch("/products/:id", authenticateUser, requirePermission("products.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Product id must be a UUID.");
    const name = requireString(req.body?.name, "name", 160);
    const description = typeof req.body?.description === "string" ? req.body.description.slice(0, 2000) : "";
    const priceMinor = req.body?.priceMinor;
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
      throw new HttpError(400, "VALIDATION_ERROR", "priceMinor must be a nonnegative integer.");
    }
    const result = await db.query(
      `UPDATE products SET name = $3, description = $4, price_minor = $5, updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status = 'active'
       RETURNING id, sku, name, description, price_minor AS "priceMinor", currency, status`,
      [req.params.id, req.auth.tenantId, name, description, priceMinor]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Product not found.");
    await addAudit(db, req, req.auth.tenantId, "user", req.auth.userId, "product.updated", "product", req.params.id);
    res.json({ data: result.rows[0] });
  });

  api.post("/products/:id/archive", authenticateUser, requirePermission("products.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Product id must be a UUID.");
    const result = await db.query(
      `UPDATE products SET status = 'archived', updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status = 'active' RETURNING id, status`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Product not found.");
    await addAudit(db, req, req.auth.tenantId, "user", req.auth.userId, "product.archived", "product", req.params.id);
    res.json({ data: result.rows[0] });
  });

  api.get("/products", authenticateUser, requirePermission("products.read"), async (req, res) => {
    const result = await db.query(
      `SELECT id, sku, name, description, price_minor AS "priceMinor", currency, status
       FROM products WHERE tenant_id = $1 ORDER BY name`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.get("/inventory", authenticateUser, requirePermission("inventory.read"), async (req, res) => {
    const result = await db.query(
      `SELECT s.id AS "slotId", s.machine_id AS "machineId", vm.name AS "machineName",
              s.position, p.name AS "productName", s.capacity, s.on_hand AS "onHand",
              s.reserved, s.on_hand - s.reserved AS available
       FROM machine_slots s JOIN vending_machines vm ON vm.id = s.machine_id AND vm.tenant_id = s.tenant_id
       LEFT JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
       WHERE s.tenant_id = $1 ORDER BY vm.name, s.position`,
      [req.auth.tenantId]
    );
    res.json({ data: result.rows });
  });

  api.post("/machines/:id/restocks", authenticateUser, requirePermission("inventory.restock", { mutable: true }), async (req, res) => {
    const machineId = req.params.id;
    if (!UUID_PATTERN.test(machineId)) throw new HttpError(400, "VALIDATION_ERROR", "Machine id must be a UUID.");
    const slotId = requireString(req.body?.slotId, "slotId");
    const quantity = req.body?.quantity;
    const reason = requireString(req.body?.reason, "reason", 300);
    if (!UUID_PATTERN.test(slotId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
      throw new HttpError(400, "VALIDATION_ERROR", "slotId must be a UUID and quantity must be from 1 to 1000.");
    }
    const result = await inDbTransaction(async (client) => {
      const slot = await client.query(
        `SELECT s.*, p.id AS actual_product_id FROM machine_slots s
         LEFT JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
         WHERE s.id = $1 AND s.machine_id = $2 AND s.tenant_id = $3
         FOR UPDATE OF s`,
        [slotId, machineId, req.auth.tenantId]
      );
      const current = slot.rows[0];
      if (!current || !current.actual_product_id) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Inventory slot not found.");
      if (current.on_hand + quantity > current.capacity) throw new HttpError(409, "INSUFFICIENT_STOCK", "Restock would exceed slot capacity.");
      await client.query(
        "UPDATE machine_slots SET on_hand = on_hand + $2, updated_at = now() WHERE id = $1",
        [slotId, quantity]
      );
      await client.query(
        `INSERT INTO inventory_movements
           (tenant_id, machine_id, slot_id, product_id, type, quantity_delta, reason, actor_type, actor_id)
         VALUES ($1, $2, $3, $4, 'restock', $5, $6, 'user', $7)`,
        [req.auth.tenantId, machineId, slotId, current.actual_product_id, quantity, reason, req.auth.userId]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "inventory.restocked", "machine_slot", slotId, { quantity });
      return { slotId, quantityAdded: quantity, onHand: current.on_hand + quantity };
    });
    res.status(201).json({ data: result });
  });

  api.post("/machines/:id/inventory-adjustments", authenticateUser, requirePermission("inventory.adjust", { mutable: true }), async (req, res) => {
    const machineId = req.params.id;
    const slotId = requireString(req.body?.slotId, "slotId");
    const delta = req.body?.quantityDelta;
    const reason = requireString(req.body?.reason, "reason", 300);
    if (!UUID_PATTERN.test(machineId) || !UUID_PATTERN.test(slotId) ||
        !Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
      throw new HttpError(400, "VALIDATION_ERROR", "Provide valid machine and slot UUIDs and a nonzero quantityDelta.");
    }
    const result = await inDbTransaction(async (client) => {
      const slot = await client.query(
        `SELECT id, product_id, on_hand, reserved, capacity FROM machine_slots
         WHERE id = $1 AND machine_id = $2 AND tenant_id = $3 FOR UPDATE`,
        [slotId, machineId, req.auth.tenantId]
      );
      const current = slot.rows[0];
      if (!current) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Inventory slot not found.");
      const next = current.on_hand + delta;
      if (next < current.reserved || next > current.capacity) {
        throw new HttpError(409, "INSUFFICIENT_STOCK", "Adjustment must keep reserved stock and capacity constraints valid.");
      }
      await client.query(
        "UPDATE machine_slots SET on_hand = $2, updated_at = now() WHERE id = $1",
        [slotId, next]
      );
      await client.query(
        `INSERT INTO inventory_movements
           (tenant_id, machine_id, slot_id, product_id, type, quantity_delta, reason, actor_type, actor_id)
         VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, 'user', $7)`,
        [req.auth.tenantId, machineId, slotId, current.product_id, delta, reason, req.auth.userId]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "inventory.adjusted", "machine_slot", slotId, { quantityDelta: delta });
      return { slotId, quantityDelta: delta, onHand: next };
    });
    res.json({ data: result });
  });

  api.get("/inventory/movements", authenticateUser, requirePermission("inventory.read"), async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);
    const result = await db.query(
      `SELECT id, machine_id AS "machineId", slot_id AS "slotId", product_id AS "productId",
              type, quantity_delta AS "quantityDelta", reason, reference_type AS "referenceType",
              reference_id AS "referenceId", actor_type AS "actorType", created_at AS "createdAt"
       FROM inventory_movements WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.auth.tenantId, limit]
    );
    res.json({ data: result.rows });
  });

  api.get("/orders", authenticateUser, requirePermission("orders.read"), async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);
    const result = await db.query(
      `SELECT id, machine_id AS "machineId", status, currency,
              total_minor AS "totalMinor", created_at AS "createdAt"
       FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.auth.tenantId, limit]
    );
    res.json({ data: result.rows });
  });

  api.get("/orders/:id", authenticateUser, requirePermission("orders.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Order id must be a UUID.");
    const order = await db.query(
      `SELECT id, machine_id AS "machineId", status, currency, subtotal_minor AS "subtotalMinor",
              total_minor AS "totalMinor", reservation_expires_at AS "reservationExpiresAt",
              created_at AS "createdAt", completed_at AS "completedAt"
       FROM orders WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!order.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Order not found.");
    const [items, payments, job] = await Promise.all([
      db.query(
        `SELECT product_snapshot AS product, quantity, unit_price_minor AS "unitPriceMinor",
                total_minor AS "totalMinor"
         FROM order_items WHERE order_id = $1 AND tenant_id = $2 ORDER BY id`,
        [req.params.id, req.auth.tenantId]
      ),
      db.query(
        `SELECT id, status, amount_minor AS "amountMinor", currency, scenario, created_at AS "createdAt"
         FROM payments WHERE order_id = $1 AND tenant_id = $2 ORDER BY created_at`,
        [req.params.id, req.auth.tenantId]
      ),
      db.query(
        `SELECT id, status, attempt_count AS "attemptCount", failure_code AS "failureCode"
         FROM dispense_jobs WHERE order_id = $1 AND tenant_id = $2`,
        [req.params.id, req.auth.tenantId]
      )
    ]);
    res.json({ data: { ...order.rows[0], items: items.rows, payments: payments.rows, dispenseJob: job.rows[0] ?? null } });
  });

  api.post("/orders/:id/cancel", authenticateUser, requirePermission("orders.manage", { mutable: true }), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Order id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const lookup = await client.query(
        `SELECT id, status FROM orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [req.params.id, req.auth.tenantId]
      );
      const order = lookup.rows[0];
      if (!order) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Order not found.");
      if (!["pending", "awaiting_payment", "failed"].includes(order.status)) {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", "This order cannot be cancelled.");
      }
      await releaseReservations(client, order.id, "released");
      await client.query(
        `UPDATE orders SET status = 'cancelled', cancelled_at = now(), updated_at = now() WHERE id = $1`,
        [order.id]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "order.cancelled", "order", order.id);
      return { id: order.id, status: "cancelled" };
    });
    res.json({ data: result });
  });

  api.get("/payments", authenticateUser, requirePermission("payments.read"), async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);
    const result = await db.query(
      `SELECT id, order_id AS "orderId", status, amount_minor AS "amountMinor",
              currency, scenario, created_at AS "createdAt"
       FROM payments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.auth.tenantId, limit]
    );
    res.json({ data: result.rows });
  });

  api.get("/payments/:id", authenticateUser, requirePermission("payments.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Payment id must be a UUID.");
    const result = await db.query(
      `SELECT id, order_id AS "orderId", status, amount_minor AS "amountMinor",
              currency, scenario, failure_code AS "failureCode", approved_at AS "approvedAt",
              created_at AS "createdAt"
       FROM payments WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Payment not found.");
    res.json({ data: result.rows[0] });
  });

  api.get("/dispense-jobs", authenticateUser, requirePermission("dispensing.read"), async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);
    const result = await db.query(
      `SELECT id, machine_id AS "machineId", order_id AS "orderId", status,
              attempt_count AS "attemptCount", failure_code AS "failureCode",
              created_at AS "createdAt", completed_at AS "completedAt"
       FROM dispense_jobs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.auth.tenantId, limit]
    );
    res.json({ data: result.rows });
  });

  api.get("/reports/overview", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const [machines, orders, revenue, stock] = await Promise.all([
      db.query(
        `SELECT status, count(*)::int AS count FROM vending_machines WHERE tenant_id = $1 GROUP BY status`,
        [req.auth.tenantId]
      ),
      db.query(
        `SELECT status, count(*)::int AS count FROM orders WHERE tenant_id = $1 GROUP BY status`,
        [req.auth.tenantId]
      ),
      db.query(
        `SELECT currency, COALESCE(sum(total_minor), 0)::bigint AS completed_sales_minor
         FROM orders WHERE tenant_id = $1 AND status = 'completed' GROUP BY currency`,
        [req.auth.tenantId]
      ),
      db.query(
        `SELECT count(*) FILTER (WHERE on_hand - reserved <= 2)::int AS low_stock_slots
         FROM machine_slots WHERE tenant_id = $1`,
        [req.auth.tenantId]
      )
    ]);
    res.json({
      data: {
        machinesByStatus: machines.rows,
        ordersByStatus: orders.rows,
        completedSales: revenue.rows,
        lowStockSlots: stock.rows[0]?.low_stock_slots ?? 0
      }
    });
  });

  api.get("/reports/sales", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "o.tenant_id",
      machineField: "o.machine_id",
      orderField: "o.id",
      statusField: "o.status",
      dateField: "o.completed_at",
      defaultDateRange: true
    });
    const result = await db.query(
      `SELECT o.currency, count(*)::int AS completed_orders,
              COALESCE(sum(o.total_minor), 0)::bigint AS sales_total_minor
       FROM orders o
       WHERE ${filters.where} AND o.status = 'completed'
       GROUP BY o.currency ORDER BY o.currency`,
      filters.values
    );
    res.json({ data: { from: filters.from, to: filters.to, rows: result.rows } });
  });

  api.get("/reports/consumption", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "oi.tenant_id",
      machineField: "o.machine_id",
      orderField: "o.id",
      productField: "oi.product_id",
      statusField: "o.status",
      dateField: "o.completed_at",
      defaultDateRange: true
    });
    const result = await db.query(
      `SELECT oi.product_id AS "productId", oi.product_snapshot->>'name' AS "productName",
              sum(oi.quantity)::int AS units, sum(oi.total_minor)::bigint AS sales_total_minor
       FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
       WHERE ${filters.where} AND o.status = 'completed'
       GROUP BY oi.product_id, oi.product_snapshot->>'name'
       ORDER BY units DESC, "productName"`,
      filters.values
    );
    res.json({ data: { from: filters.from, to: filters.to, rows: result.rows } });
  });

  api.get("/reports/inventory", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "s.tenant_id",
      machineField: "vm.id",
      productField: "s.product_id",
      statusField: "s.status"
    });
    const result = await db.query(
      `SELECT s.id AS "slotId", vm.id AS "machineId", vm.name AS "machineName",
              l.id AS "locationId", l.name AS "locationName", s.position,
              p.id AS "productId", p.name AS "productName", s.on_hand AS "onHand",
              s.reserved, s.on_hand - s.reserved AS available, s.capacity,
              CASE WHEN s.capacity = 0 THEN 0 ELSE round(s.on_hand * 100.0 / s.capacity, 1) END AS "levelPercent"
       FROM machine_slots s
       JOIN vending_machines vm ON vm.id = s.machine_id AND vm.tenant_id = s.tenant_id
       JOIN locations l ON l.id = vm.location_id AND l.tenant_id = vm.tenant_id
       LEFT JOIN products p ON p.id = s.product_id AND p.tenant_id = s.tenant_id
       WHERE ${filters.where} ORDER BY l.name, vm.name, s.position`,
      filters.values
    );
    res.json({ data: result.rows });
  });

  api.get("/reports/payments", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "p.tenant_id",
      machineField: "o.machine_id",
      orderField: "p.order_id",
      statusField: "p.status",
      dateField: "p.created_at",
      defaultDateRange: true
    });
    const result = await db.query(
      `SELECT p.status, p.scenario, p.currency, count(*)::int AS attempts,
              COALESCE(sum(p.amount_minor), 0)::bigint AS amount_minor
       FROM payments p JOIN orders o ON o.id = p.order_id AND o.tenant_id = p.tenant_id
       WHERE ${filters.where}
       GROUP BY p.status, p.scenario, p.currency ORDER BY p.status, p.scenario`,
      filters.values
    );
    res.json({ data: { from: filters.from, to: filters.to, rows: result.rows } });
  });

  api.get("/reports/dispensing", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "j.tenant_id",
      machineField: "o.machine_id",
      orderField: "j.order_id",
      statusField: "j.status",
      dateField: "j.created_at",
      defaultDateRange: true
    });
    const result = await db.query(
      `SELECT j.status, count(*)::int AS jobs,
              round(avg(extract(epoch FROM (j.completed_at - j.started_at))) FILTER (WHERE j.status = 'dispensed'), 2) AS "averageSeconds"
       FROM dispense_jobs j JOIN orders o ON o.id = j.order_id AND o.tenant_id = j.tenant_id
       WHERE ${filters.where}
       GROUP BY j.status ORDER BY j.status`,
      filters.values
    );
    res.json({ data: { from: filters.from, to: filters.to, rows: result.rows } });
  });

  api.get("/reports/machines", authenticateUser, requirePermission("reports.read"), async (req, res) => {
    const filters = getReportFilters(req.query, req.auth.tenantId, {
      tenantField: "vm.tenant_id",
      machineField: "vm.id",
      orderField: "j.order_id",
      statusField: "vm.status",
      dateField: "j.created_at"
    });
    const result = await db.query(
      `SELECT vm.id, vm.name, vm.status, l.name AS "locationName",
              vm.last_heartbeat_at AS "lastHeartbeatAt",
              count(DISTINCT j.id)::int AS "dispenseJobs"
       FROM vending_machines vm
       JOIN locations l ON l.id = vm.location_id AND l.tenant_id = vm.tenant_id
       LEFT JOIN dispense_jobs j ON j.machine_id = vm.id AND j.tenant_id = vm.tenant_id
       WHERE ${filters.where}
       GROUP BY vm.id, l.name ORDER BY vm.name`,
      filters.values
    );
    res.json({ data: result.rows });
  });

  api.post("/dispense-jobs/:id/retry", authenticateUser, requirePermission("dispensing.retry", { mutable: true }), async (req, res) => {
    const jobId = req.params.id;
    if (!UUID_PATTERN.test(jobId)) throw new HttpError(400, "VALIDATION_ERROR", "Job id must be a UUID.");
    const result = await inDbTransaction(async (client) => {
      const query = await client.query(
        `SELECT j.id, j.order_id, j.status, j.attempt_count
         FROM dispense_jobs j WHERE j.id = $1 AND j.tenant_id = $2 FOR UPDATE`,
        [jobId, req.auth.tenantId]
      );
      const job = query.rows[0];
      if (!job) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Job not found.");
      if (job.status !== "failed" || job.attempt_count >= 3) {
        throw new HttpError(409, "DISPENSE_JOB_NOT_AVAILABLE", "Job cannot be retried.");
      }
      const reservations = await client.query(
        `SELECT 1 FROM inventory_reservations
         WHERE order_id = $1 AND status = 'active' AND expires_at > now() LIMIT 1`,
        [job.order_id]
      );
      if (!reservations.rowCount) throw new HttpError(409, "RESERVATION_EXPIRED", "The order no longer has an active reservation.");
      await client.query(
        `UPDATE dispense_jobs SET status = 'queued', failure_code = NULL, failed_at = NULL, updated_at = now()
         WHERE id = $1`,
        [job.id]
      );
      await client.query(
        "UPDATE orders SET status = 'paid', updated_at = now() WHERE id = $1",
        [job.order_id]
      );
      await addAudit(client, req, req.auth.tenantId, "user", req.auth.userId, "dispense.retried", "dispense_job", job.id);
      return { id: job.id, status: "queued" };
    });
    res.json({ data: result });
  });

  api.get("/audit-events/:id", authenticateUser, requirePermission("audit.read"), async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw new HttpError(400, "VALIDATION_ERROR", "Audit event id must be a UUID.");
    const result = await db.query(
      `SELECT id, actor_type AS "actorType", actor_id AS "actorId", action,
              resource_type AS "resourceType", resource_id AS "resourceId",
              request_id AS "requestId", metadata, created_at AS "createdAt"
       FROM audit_events WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.auth.tenantId]
    );
    if (!result.rowCount) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Audit event not found.");
    res.json({ data: result.rows[0] });
  });

  api.get("/audit-events", authenticateUser, requirePermission("audit.read"), async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);
    const result = await db.query(
      `SELECT id, actor_type, action, resource_type, resource_id, metadata, created_at
       FROM audit_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.auth.tenantId, limit]
    );
    res.json({ data: result.rows });
  });

  const webRoot = fileURLToPath(new URL("../apps/", import.meta.url));
  app.use("/admin", express.static(path.join(webRoot, "admin-web")));
  app.use("/buyer", express.static(path.join(webRoot, "vending-web"), { index: false }));
  app.get("/", (req, res) => res.sendFile(path.join(webRoot, "vending-web", "index.html")));
  app.get("/buy", (req, res) => res.sendFile(path.join(webRoot, "vending-web", "buyer.html")));
  app.get("/simulator", (req, res) => res.sendFile(path.join(webRoot, "vending-web", "simulator.html")));

  app.use((req, res) => {
    sendError(new HttpError(404, "RESOURCE_NOT_FOUND", "Route not found."), req.requestId, res);
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && "body" in error) {
      return sendError(new HttpError(400, "VALIDATION_ERROR", "Request body must be valid JSON."), req.requestId, res);
    }
    sendError(error, req.requestId, res);
  });

  app.locals.expireReservations = () => expireReservations(inDbTransaction);
  return app;
}

export { HttpError, normalizeItems };
