import { createHmac, createHash, timingSafeEqual } from "node:crypto";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function hashToken(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function signToken(payload, secret, ttlSeconds = 900) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }));
  const unsigned = `${header}.${body}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", secret).update(unsigned).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (header.alg !== "HS256" || typeof payload.exp !== "number" || payload.exp <= Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function derivePublicOrderToken(tenantId, key, requestHash, secret) {
  return createHmac("sha256", secret)
    .update(`m24-order:${tenantId}:${key}:${requestHash}`)
    .digest("base64url");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}
