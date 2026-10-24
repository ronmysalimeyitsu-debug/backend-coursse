import "dotenv/config";
import { randomBytes } from "node:crypto";

const apiBase = `${process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/api/v1`;
const suffix = randomBytes(5).toString("hex");
const slugA = `m24-integration-a-${suffix}`;
const slugB = `m24-integration-b-${suffix}`;
const adminEmail = `integration-${suffix}@m24.local`;
const adminPassword = randomBytes(18).toString("base64url");
const createdTenantIds = [];
let platformToken;

async function request(path, { method = "GET", body, token, headers = {} } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = response.status === 204 ? null : await response.json();
  return { status: response.status, data: payload?.data, error: payload?.error };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectStatus(response, status, operation) {
  expect(
    response.status === status,
    `${operation}: expected ${status}, received ${response.status} (${response.error?.message ?? "no error message"})`
  );
  return response.data;
}

async function archiveCreatedTenants() {
  if (!platformToken) return;
  for (const tenantId of createdTenantIds.reverse()) {
    try {
      const tenant = await request(`/platform/tenants/${tenantId}`, { token: platformToken });
      if (tenant.status === 200 && tenant.data.status !== "archived") {
        await request(`/platform/tenants/${tenantId}/archive`, { method: "POST", token: platformToken });
      }
    } catch (error) {
      console.error(`Could not archive integration tenant ${tenantId}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

try {
  if (!process.env.PLATFORM_ADMIN_EMAIL || !process.env.PLATFORM_ADMIN_PASSWORD) {
    throw new Error("Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in .env, then run the seed.");
  }

  const ready = await request("/ready");
  expectStatus(ready, 200, "API readiness");

  const platform = expectStatus(await request("/platform/auth/login", {
    method: "POST",
    body: { email: process.env.PLATFORM_ADMIN_EMAIL, password: process.env.PLATFORM_ADMIN_PASSWORD }
  }), 200, "platform login");
  platformToken = platform.accessToken;
  expect(platformToken, "Platform login did not return an access token.");

  const tenantA = expectStatus(await request("/platform/tenants", {
    method: "POST",
    token: platformToken,
    body: {
      slug: slugA,
      name: "M24 Integration Alpha",
      adminEmail,
      adminDisplayName: "Integration Admin",
      adminPassword
    }
  }), 201, "create first tenant");
  createdTenantIds.push(tenantA.id);

  const tenantB = expectStatus(await request("/platform/tenants", {
    method: "POST",
    token: platformToken,
    body: { slug: slugB, name: "M24 Integration Beta", adminEmail, adminDisplayName: "Integration Admin" }
  }), 201, "add existing user to second tenant");
  createdTenantIds.push(tenantB.id);

  const auth = expectStatus(await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword, tenantId: tenantA.id }
  }), 200, "tenant admin login");
  const memberships = expectStatus(await request("/auth/tenants", { token: auth.accessToken }), 200, "list memberships");
  expect(memberships.length === 2, "The user must be a member of both tenants.");

  const switched = expectStatus(await request("/auth/switch-tenant", {
    method: "POST",
    token: auth.accessToken,
    body: { tenantId: tenantB.id, refreshToken: auth.refreshToken }
  }), 200, "switch tenant");
  expect((await request("/auth/refresh", { method: "POST", body: { refreshToken: auth.refreshToken } })).status === 401,
    "Switching tenants must revoke the previous refresh session when supplied.");
  const rotatedSession = expectStatus(await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: switched.refreshToken }
  }), 200, "refresh switched-tenant session");
  expect((await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: switched.refreshToken }
  })).status === 401, "A reused refresh token must be rejected.");
  expect((await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: rotatedSession.refreshToken }
  })).status === 401, "Reusing a refresh token must revoke its token family.");
  const tenantBToken = rotatedSession.accessToken;
  const locationB = expectStatus(await request("/locations", {
    method: "POST",
    token: tenantBToken,
    body: { code: `B-${suffix}`, name: "Tenant B location" }
  }), 201, "create tenant B location");
  expect((await request(`/locations/${locationB.id}`, { token: auth.accessToken })).status === 404,
    "Tenant A must not read a location owned by tenant B.");

  const permissions = expectStatus(await request("/permissions", { token: auth.accessToken }), 200, "list permissions");
  const role = expectStatus(await request("/roles", {
    method: "POST",
    token: auth.accessToken,
    body: {
      name: `integration-${suffix}`,
      description: "Integration role",
      permissions: [permissions.find((permission) => permission.code === "reports.read").code]
    }
  }), 201, "create role");
  const updatedRole = expectStatus(await request(`/roles/${role.id}`, {
    method: "PATCH",
    token: auth.accessToken,
    body: { name: `integration-updated-${suffix}` }
  }), 200, "update role");
  expect(updatedRole.name === `integration-updated-${suffix}`, "Role update returned the wrong name.");

  const location = expectStatus(await request("/locations", {
    method: "POST",
    token: auth.accessToken,
    body: { code: `A-${suffix}`, name: "Integration location", timezone: "UTC", address: { city: "Demo" } }
  }), 201, "create location");
  const updatedLocation = expectStatus(await request(`/locations/${location.id}`, {
    method: "PATCH",
    token: auth.accessToken,
    body: { name: "Updated integration location" }
  }), 200, "update location");
  expect(updatedLocation.name === "Updated integration location", "Location update returned the wrong name.");

  const product = expectStatus(await request("/products", {
    method: "POST",
    token: auth.accessToken,
    body: { sku: `SKU-${suffix}`, name: "Integration drink", priceMinor: 175, currency: "USD" }
  }), 201, "create product");
  const machine = expectStatus(await request("/machines", {
    method: "POST",
    token: auth.accessToken,
    body: { locationId: location.id, code: `M-${suffix}`, name: "Integration machine" }
  }), 201, "create machine");
  const updatedMachine = expectStatus(await request(`/machines/${machine.id}`, {
    method: "PATCH",
    token: auth.accessToken,
    body: { name: "Updated integration machine" }
  }), 200, "update machine");
  expect(updatedMachine.name === "Updated integration machine", "Machine update returned the wrong name.");

  const slot = expectStatus(await request(`/machines/${machine.id}/slots`, {
    method: "POST",
    token: auth.accessToken,
    body: { position: "A1", productId: product.id, capacity: 5 }
  }), 201, "create slot");
  expectStatus(await request(`/machines/${machine.id}/restocks`, {
    method: "POST",
    token: auth.accessToken,
    body: { slotId: slot.id, quantity: 3, reason: "Integration test stock" }
  }), 201, "restock slot");
  const limitedEmail = `limited-${suffix}@m24.local`;
  const limitedPassword = randomBytes(18).toString("base64url");
  const limitedMember = expectStatus(await request("/members", {
    method: "POST",
    token: auth.accessToken,
    body: {
      email: limitedEmail,
      displayName: "Read-only member",
      password: limitedPassword,
      roleIds: [role.id]
    }
  }), 201, "create limited member");
  const limitedLogin = expectStatus(await request("/auth/login", {
    method: "POST",
    body: { email: limitedEmail, password: limitedPassword, tenantId: tenantA.id }
  }), 200, "login limited member");
  expect((await request("/reports/overview", { token: limitedLogin.accessToken })).status === 200,
    "Reports-only member should be allowed to read reports.");
  expect((await request(`/machines/${machine.id}/restocks`, {
    method: "POST",
    token: limitedLogin.accessToken,
    body: { slotId: slot.id, quantity: 1, reason: "Permission denial test" }
  })).status === 403, "Reports-only member must not restock inventory.");
  const finalUnitSlot = expectStatus(await request(`/machines/${machine.id}/slots`, {
    method: "POST",
    token: auth.accessToken,
    body: { position: "A2", productId: product.id, capacity: 1 }
  }), 201, "create last-unit slot");
  expectStatus(await request(`/machines/${machine.id}/restocks`, {
    method: "POST",
    token: auth.accessToken,
    body: { slotId: finalUnitSlot.id, quantity: 1, reason: "Concurrency test stock" }
  }), 201, "restock last-unit slot");

  const inventory = expectStatus(await request(
    `/reports/inventory?locationId=${location.id}&machineId=${machine.id}&productId=${product.id}&status=active`,
    { token: auth.accessToken }
  ), 200, "filtered inventory report");
  expect(inventory.some((row) => row.slotId === slot.id && row.onHand === 3),
    "Filtered inventory totals do not match the stock.");

  const order = expectStatus(await request(`/public/machines/${encodeURIComponent(machine.publicCode)}/orders`, {
    method: "POST",
    body: { items: [{ slotId: slot.id, quantity: 1 }] },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 201, "create public order");
  const payment = expectStatus(await request(`/public/orders/${encodeURIComponent(order.publicToken)}/payments/simulate`, {
    method: "POST",
    body: { outcome: "approved" },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 200, "approve simulated payment");
  expect(payment.status === "approved", "Payment did not reach approved status.");

  const device = expectStatus(await request("/devices/authenticate", {
    method: "POST",
    body: { publicCode: machine.publicCode, deviceKey: machine.deviceKey }
  }), 200, "authenticate machine");
  const job = expectStatus(await request("/devices/jobs/next", { token: device.accessToken }), 200, "claim dispense job");
  expect(job?.id, "The machine did not claim a dispense job.");
  const completed = expectStatus(await request(`/devices/jobs/${job.id}/complete`, {
    method: "POST",
    token: device.accessToken,
    body: {}
  }), 200, "complete dispense job");
  const repeatedCompletion = expectStatus(await request(`/devices/jobs/${job.id}/complete`, {
    method: "POST",
    token: device.accessToken,
    body: {}
  }), 200, "repeat dispense completion");
  expect(!completed.duplicate && repeatedCompletion.duplicate, "Repeated completion must not duplicate inventory movements.");

  const declinedOrder = expectStatus(await request(`/public/machines/${encodeURIComponent(machine.publicCode)}/orders`, {
    method: "POST",
    body: { items: [{ slotId: slot.id, quantity: 1 }] },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 201, "create declined-payment order");
  const declinedPayment = expectStatus(await request(`/public/orders/${encodeURIComponent(declinedOrder.publicToken)}/payments/simulate`, {
    method: "POST",
    body: { outcome: "declined" },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 200, "decline simulated payment");
  expect(declinedPayment.status === "declined", "Declined payment returned the wrong status.");
  const declinedOrderStatus = expectStatus(await request(`/public/orders/${encodeURIComponent(declinedOrder.publicToken)}`), 200, "read declined-payment order");
  expect(declinedOrderStatus.paymentStatus === "declined" && declinedOrderStatus.dispenseJob === null,
    "A declined payment must not create a dispense job.");
  expectStatus(await request(`/public/orders/${encodeURIComponent(declinedOrder.publicToken)}/cancel`, {
    method: "POST",
    body: {}
  }), 200, "cancel declined order");

  const timeoutOrder = expectStatus(await request(`/public/machines/${encodeURIComponent(machine.publicCode)}/orders`, {
    method: "POST",
    body: { items: [{ slotId: slot.id, quantity: 1 }] },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 201, "create timeout-payment order");
  const timeoutPayment = expectStatus(await request(`/public/orders/${encodeURIComponent(timeoutOrder.publicToken)}/payments/simulate`, {
    method: "POST",
    body: { outcome: "timeout" },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 200, "simulate payment timeout");
  expect(timeoutPayment.status === "timeout", "Timeout scenario returned the wrong status.");
  const pendingOrder = expectStatus(await request(`/public/orders/${encodeURIComponent(timeoutOrder.publicToken)}`), 200, "read timed-out order");
  expect(pendingOrder.dispenseJob === null, "A timed-out payment must not create a dispense job.");
  const retryPayment = expectStatus(await request(`/public/orders/${encodeURIComponent(timeoutOrder.publicToken)}/payments/simulate`, {
    method: "POST",
    body: { outcome: "approved" },
    headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
  }), 200, "retry payment after timeout");
  expect(retryPayment.status === "approved", "Retry after timeout was not approved.");
  const retryJob = expectStatus(await request("/devices/jobs/next", { token: device.accessToken }), 200, "claim retried job");
  expect(retryJob?.id, "Approved payment retry did not create a dispense job.");
  expectStatus(await request(`/devices/jobs/${retryJob.id}/complete`, {
    method: "POST",
    token: device.accessToken,
    body: {}
  }), 200, "complete retried dispense job");

  const competingOrders = await Promise.all([
    request(`/public/machines/${encodeURIComponent(machine.publicCode)}/orders`, {
      method: "POST",
      body: { items: [{ slotId: finalUnitSlot.id, quantity: 1 }] },
      headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
    }),
    request(`/public/machines/${encodeURIComponent(machine.publicCode)}/orders`, {
      method: "POST",
      body: { items: [{ slotId: finalUnitSlot.id, quantity: 1 }] },
      headers: { "Idempotency-Key": randomBytes(16).toString("hex") }
    })
  ]);
  expect(competingOrders.filter((result) => result.status === 201).length === 1 &&
    competingOrders.filter((result) => result.status === 409).length === 1,
  "Exactly one of two concurrent orders for the last unit must succeed.");
  const winner = competingOrders.find((result) => result.status === 201).data;
  expectStatus(await request(`/public/orders/${encodeURIComponent(winner.publicToken)}/cancel`, {
    method: "POST",
    body: {}
  }), 200, "release winning concurrency reservation");

  const orderDetails = expectStatus(await request(`/orders/${order.id}`, { token: auth.accessToken }), 200, "read completed order");
  expect(orderDetails.status === "completed", "Order did not reach the completed state.");
  const sales = expectStatus(await request(
    `/reports/sales?locationId=${location.id}&machineId=${machine.id}&productId=${product.id}`,
    { token: auth.accessToken }
  ), 200, "filtered sales report");
  expect(sales.rows.length === 1 && Number(sales.rows[0].completed_orders) === 2, "Sales report totals are incorrect.");
  const payments = expectStatus(await request(
    `/reports/payments?machineId=${machine.id}&productId=${product.id}&status=approved`,
    { token: auth.accessToken }
  ), 200, "filtered payments report");
  expect(payments.rows.length === 1, "Payments report filters returned incorrect results.");
  const dispensing = expectStatus(await request(
    `/reports/dispensing?machineId=${machine.id}&productId=${product.id}&status=dispensed`,
    { token: auth.accessToken }
  ), 200, "filtered dispensing report");
  expect(dispensing.rows.length === 1, "Dispensing report filters returned incorrect results.");
  const audit = expectStatus(await request("/audit-events?limit=10", { token: auth.accessToken }), 200, "read audit log");
  expect(audit.length > 0, "Expected audit events from integration operations.");
  expectStatus(await request(`/audit-events/${audit[0].id}`, { token: auth.accessToken }), 200, "read audit event");
  expectStatus(await request(`/members/${limitedMember.membershipId}`, {
    method: "PATCH",
    token: auth.accessToken,
    body: { status: "suspended" }
  }), 200, "suspend limited member");
  expectStatus(await request(`/members/${limitedMember.membershipId}/roles`, {
    method: "PUT",
    token: auth.accessToken,
    body: { roleIds: [] }
  }), 200, "remove role assignment");
  expectStatus(await request(`/roles/${role.id}`, { method: "DELETE", token: auth.accessToken }), 204, "delete unassigned role");

  console.log("Integration smoke passed: multitenancy, administration, concurrent stock reservation, payment outcomes, dispatch, reports, and audit.");
} catch (error) {
  console.error(`Integration smoke failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await archiveCreatedTenants();
}
