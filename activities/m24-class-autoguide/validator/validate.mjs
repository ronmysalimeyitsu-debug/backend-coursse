import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import process from "node:process";

const configPath = process.argv[2] ?? new URL("./validator.config.json", import.meta.url);

function stop(message) {
  console.error(`CONFIGURATION ERROR: ${message}`);
  process.exitCode = 2;
  throw new Error(message);
}

async function loadConfig() {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.apiBaseUrl) stop("apiBaseUrl is required.");
    if (!parsed.publicCode) stop("publicCode is required.");
    if (!["smoke", "purchase"].includes(parsed.mode ?? "smoke")) {
      stop("mode must be smoke or purchase.");
    }
    if ((parsed.mode ?? "smoke") === "purchase" && !parsed.slotId) {
      stop("slotId is required in purchase mode.");
    }
    return {
      ...parsed,
      apiBaseUrl: parsed.apiBaseUrl.replace(/\/$/, ""),
      mode: parsed.mode ?? "smoke",
      quantity: parsed.quantity ?? 1,
      timeoutMs: parsed.timeoutMs ?? 8000
    };
  } catch (error) {
    if (process.exitCode === 2) throw error;
    stop(`Cannot read ${String(configPath)}: ${error.message}`);
  }
}

const config = await loadConfig();
const checks = [];

function unwrap(body) {
  return body && typeof body === "object" && "data" in body ? body.data : body;
}

function findValue(object, names) {
  const value = unwrap(object);
  if (!value || typeof value !== "object") return undefined;
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
  }
  return undefined;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers ?? {})
      }
    });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { status: response.status, body, headers: Object.fromEntries(response.headers) };
  } finally {
    clearTimeout(timer);
  }
}

async function check(name, run) {
  const started = Date.now();
  try {
    const detail = await run();
    checks.push({ name, passed: true, durationMs: Date.now() - started, detail });
  } catch (error) {
    checks.push({ name, passed: false, durationMs: Date.now() - started, detail: error.message });
  }
}

function expectStatus(response, allowed, context) {
  if (!allowed.includes(response.status)) {
    throw new Error(`${context}: expected ${allowed.join("/")}, received ${response.status}`);
  }
}

function expectErrorEnvelope(response) {
  if (!response.body?.error?.code || !response.body?.error?.message) {
    throw new Error("Error response does not use error.code and error.message.");
  }
}

await check("health returns 200", async () => {
  const response = await request("/health");
  expectStatus(response, [200], "health");
  return "process is alive";
});

await check("ready returns 200", async () => {
  const response = await request("/ready");
  expectStatus(response, [200], "ready");
  return "dependencies are ready";
});

await check("public machine is readable", async () => {
  const response = await request(`/public/machines/${encodeURIComponent(config.publicCode)}`);
  expectStatus(response, [200], "public machine");
  if (!response.body || typeof response.body !== "object") throw new Error("Expected JSON body.");
  return "machine representation received";
});

await check("public catalog is readable", async () => {
  const response = await request(`/public/machines/${encodeURIComponent(config.publicCode)}/catalog`);
  expectStatus(response, [200], "public catalog");
  const body = unwrap(response.body);
  if (!body || typeof body !== "object") throw new Error("Expected JSON catalog.");
  return "catalog representation received";
});

await check("unknown public code returns safe 404", async () => {
  const response = await request(`/public/machines/not-found-${randomUUID()}`);
  expectStatus(response, [404], "unknown public machine");
  expectErrorEnvelope(response);
  return response.body.error.code;
});

await check("empty order is rejected consistently", async () => {
  const response = await request(`/public/machines/${encodeURIComponent(config.publicCode)}/orders`, {
    method: "POST",
    headers: { "Idempotency-Key": randomUUID() },
    body: JSON.stringify({ items: [] })
  });
  expectStatus(response, [400, 422], "empty order");
  expectErrorEnvelope(response);
  return response.body.error.code;
});

if (config.mode === "purchase") {
  const orderKey = randomUUID();
  const orderPayload = { items: [{ slotId: config.slotId, quantity: config.quantity }] };
  let firstOrder;
  let publicToken;

  await check("order can be created", async () => {
    firstOrder = await request(`/public/machines/${encodeURIComponent(config.publicCode)}/orders`, {
      method: "POST",
      headers: { "Idempotency-Key": orderKey },
      body: JSON.stringify(orderPayload)
    });
    expectStatus(firstOrder, [201], "create order");
    publicToken = findValue(firstOrder.body, ["publicToken", "public_token"]);
    if (!publicToken) throw new Error("Response does not contain publicToken.");
    return `order ${findValue(firstOrder.body, ["id", "orderId"]) ?? "created"}`;
  });

  await check("same order key returns the same order", async () => {
    const retry = await request(`/public/machines/${encodeURIComponent(config.publicCode)}/orders`, {
      method: "POST",
      headers: { "Idempotency-Key": orderKey },
      body: JSON.stringify(orderPayload)
    });
    expectStatus(retry, [200, 201], "idempotent order retry");
    const firstId = findValue(firstOrder?.body, ["id", "orderId"]);
    const retryId = findValue(retry.body, ["id", "orderId"]);
    if (!firstId || !retryId || firstId !== retryId) {
      throw new Error("Retry did not return the same order identifier.");
    }
    return String(firstId);
  });

  await check("same key with different payload conflicts", async () => {
    const response = await request(`/public/machines/${encodeURIComponent(config.publicCode)}/orders`, {
      method: "POST",
      headers: { "Idempotency-Key": orderKey },
      body: JSON.stringify({ items: [{ slotId: config.slotId, quantity: config.quantity + 1 }] })
    });
    expectStatus(response, [409], "idempotency conflict");
    expectErrorEnvelope(response);
    return response.body.error.code;
  });

  const paymentKey = randomUUID();
  let firstPayment;

  await check("simulated payment can be approved", async () => {
    if (!publicToken) throw new Error("Order creation did not provide publicToken.");
    firstPayment = await request(`/public/orders/${encodeURIComponent(publicToken)}/payments/simulate`, {
      method: "POST",
      headers: { "Idempotency-Key": paymentKey },
      body: JSON.stringify({ outcome: "approved" })
    });
    expectStatus(firstPayment, [200, 201, 202], "approve payment");
    const status = findValue(firstPayment.body, ["status", "paymentStatus"]);
    if (status && status !== "approved") throw new Error(`Expected approved, received ${status}.`);
    return "payment accepted";
  });

  await check("payment retry does not create another attempt", async () => {
    if (!publicToken) throw new Error("Order creation did not provide publicToken.");
    const retry = await request(`/public/orders/${encodeURIComponent(publicToken)}/payments/simulate`, {
      method: "POST",
      headers: { "Idempotency-Key": paymentKey },
      body: JSON.stringify({ outcome: "approved" })
    });
    expectStatus(retry, [200, 201, 202], "payment retry");
    const firstId = findValue(firstPayment?.body, ["id", "paymentId"]);
    const retryId = findValue(retry.body, ["id", "paymentId"]);
    if (firstId && retryId && firstId !== retryId) {
      throw new Error("Retry returned a different payment identifier.");
    }
    return firstId ? String(firstId) : "same terminal result returned";
  });
}

const passed = checks.filter((item) => item.passed).length;
const failed = checks.length - passed;
const report = {
  schemaVersion: "m24-validator-1",
  generatedAt: new Date().toISOString(),
  target: config.apiBaseUrl,
  mode: config.mode,
  summary: { total: checks.length, passed, failed },
  checks
};

await writeFile("m24-validation-report.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.table(checks.map(({ name, passed, durationMs, detail }) => ({
  check: name,
  result: passed ? "PASS" : "FAIL",
  durationMs,
  detail
})));
console.log(`\n${passed}/${checks.length} checks passed.`);
console.log("Report: m24-validation-report.json");

if (failed > 0) process.exitCode = 1;

