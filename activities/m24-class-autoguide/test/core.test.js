import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://m24-test:unused@127.0.0.1:5432/m24-test";
process.env.JWT_SECRET ??= "m24-test-secret-that-is-at-least-thirty-two-characters";

const [
  { createApp, normalizeItems },
  { hashPassword, verifyPassword },
  { signToken, verifyToken, stableHash }
] = await Promise.all([
  import("../src/app.js"),
  import("../src/security/passwords.js"),
  import("../src/security/tokens.js")
]);

test("normalizes duplicate order lines and sorts by slot", () => {
  const items = normalizeItems([
    { slotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", quantity: 1 },
    { slotId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", quantity: 2 },
    { slotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", quantity: 3 }
  ]);
  assert.deepEqual(items, [
    { slotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", quantity: 4 },
    { slotId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", quantity: 2 }
  ]);
});

test("rejects malformed and excessive order lines", () => {
  assert.throws(() => normalizeItems([]), { code: "VALIDATION_ERROR" });
  assert.throws(() => normalizeItems([{ slotId: "bad", quantity: 1 }]), { code: "VALIDATION_ERROR" });
  assert.throws(() => normalizeItems([{ slotId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", quantity: 101 }]), {
    code: "VALIDATION_ERROR"
  });
});

test("signed tokens verify, expire and reject tampering", () => {
  const token = signToken({ kind: "user", userId: "user-1" }, "test-secret", 60);
  assert.equal(verifyToken(token, "test-secret").userId, "user-1");
  const [header, payload, signature] = token.split(".");
  assert.equal(verifyToken(`${header}.${payload}x.${signature}`, "test-secret"), null);
  assert.equal(verifyToken(signToken({}, "test-secret", -1), "test-secret"), null);
});

test("password hashes verify only the matching password", async () => {
  const encoded = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", encoded), true);
  assert.equal(await verifyPassword("incorrect", encoded), false);
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
});

test("health is independent of database readiness", async (context) => {
  const db = {
    async query() {
      throw Object.assign(new Error("sensitive database details"), { code: "ECONNREFUSED" });
    }
  };
  const app = createApp({ db, jwtSecret: "m24-test-secret-that-is-at-least-thirty-two-characters", corsOrigins: [] });
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(health.status, 200);
  assert.ok(health.headers.get("x-request-id"));

  const readiness = await fetch(`http://127.0.0.1:${port}/api/v1/ready`);
  assert.equal(readiness.status, 503);
  const body = await readiness.json();
  assert.equal(body.error.code, "DATABASE_UNAVAILABLE");
  assert.equal(JSON.stringify(body).includes("sensitive database details"), false);
});

test("same-origin module assets load while untrusted origins remain blocked", async (context) => {
  const app = createApp({
    db: { async query() { return { rows: [] }; } },
    jwtSecret: "m24-test-secret-that-is-at-least-thirty-two-characters",
    corsOrigins: []
  });
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  const sameOriginAsset = await fetch(`${origin}/admin/platform.js`, { headers: { Origin: origin } });
  assert.equal(sameOriginAsset.status, 200);
  assert.match(sameOriginAsset.headers.get("content-type"), /javascript/);

  const untrustedOrigin = await fetch(`${origin}/admin/platform.js`, {
    headers: { Origin: "https://untrusted.example" }
  });
  assert.equal(untrustedOrigin.status, 403);
});

test("stable request hashes do not depend on object property order", () => {
  assert.equal(stableHash({ slotId: "a", quantity: 1 }), stableHash({ quantity: 1, slotId: "a" }));
});
