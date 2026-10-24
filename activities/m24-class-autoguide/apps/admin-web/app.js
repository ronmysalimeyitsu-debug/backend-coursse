const API = "/api/v1";
const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const notice = document.querySelector("#notice");
const loginNotice = document.querySelector("#login-notice");
const inventory = document.querySelector("#inventory");
const tenantSelect = document.querySelector("#tenant-select");
let token = sessionStorage.getItem("m24-admin-token");
let refreshToken = sessionStorage.getItem("m24-admin-refresh");
let permissions = new Set();
let currentTenantId;

async function request(path, options = {}, retried = false) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  if (response.status === 401 && !retried && refreshToken && path !== "/auth/refresh") {
    const rotated = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    const rotatedBody = await rotated.json().catch(() => ({}));
    if (!rotated.ok) {
      clearSession();
      throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }
    token = rotatedBody.data.accessToken;
    refreshToken = rotatedBody.data.refreshToken;
    sessionStorage.setItem("m24-admin-token", token);
    sessionStorage.setItem("m24-admin-refresh", refreshToken);
    return request(path, options, true);
  }
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? `Solicitud fallida (${response.status}).`);
  return body?.data;
}

function showNotice(message, isError = false) {
  const target = dashboard.hidden ? loginNotice : notice;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function hasPermission(permission) {
  return permissions.has(permission);
}

function createCard(titleText, detailText) {
  const card = document.createElement("article");
  card.className = "stock-card";
  const title = document.createElement("strong");
  title.textContent = titleText;
  card.append(title);
  if (detailText) {
    const detail = document.createElement("span");
    detail.textContent = detailText;
    card.append(detail);
  }
  return card;
}

function setOptions(select, rows, { value, label, placeholder = "Seleccionar…" } = {}) {
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.append(first);
  for (const row of rows) {
    const option = document.createElement("option");
    option.value = row[value];
    option.textContent = label(row);
    select.append(option);
  }
}

function showPermissionSections() {
  for (const section of dashboard.querySelectorAll("[data-permission]")) {
    section.hidden = !hasPermission(section.dataset.permission);
  }
}

async function loadInventory() {
  if (!hasPermission("inventory.read")) {
    document.querySelector("#inventory").textContent = "Tu rol no permite consultar inventario.";
    return;
  }
  const rows = await request("/inventory");
  inventory.replaceChildren();
  for (const slot of rows) {
    const card = createCard(`${slot.machineName} · ${slot.position} · ${slot.productName}`,
      `En mano: ${slot.onHand} · Reservado: ${slot.reserved} · Disponible: ${slot.available}`);
    if (hasPermission("inventory.restock")) {
      const button = document.createElement("button");
      button.textContent = "Abastecer +5";
      button.addEventListener("click", async () => {
        try {
          await request(`/machines/${slot.machineId}/restocks`, {
            method: "POST",
            body: JSON.stringify({ slotId: slot.slotId, quantity: 5, reason: "Abastecimiento desde administración" })
          });
          showNotice("Inventario actualizado y movimiento auditado.");
          await loadDashboard();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(button);
    }
    if (hasPermission("inventory.adjust")) {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = "Ajustar -1";
      button.addEventListener("click", async () => {
        try {
          await request(`/machines/${slot.machineId}/inventory-adjustments`, {
            method: "POST",
            body: JSON.stringify({ slotId: slot.slotId, quantityDelta: -1, reason: "Ajuste de inventario desde administración" })
          });
          showNotice("Ajuste registrado en el ledger.");
          await loadDashboard();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(button);
    }
    inventory.append(card);
  }
  if (!rows.length) inventory.textContent = "No hay slots configurados.";
}

async function loadLocations() {
  if (!hasPermission("locations.read")) return [];
  const locations = await request("/locations");
  setOptions(document.querySelector("#machine-form [name=locationId]"), locations, {
    value: "id",
    label: (location) => `${location.name} (${location.code})`
  });
  const list = document.querySelector("#locations");
  list.replaceChildren();
  for (const location of locations) {
    const card = createCard(`${location.name} (${location.code})`, `${location.timezone} · ${location.status}`);
    if (hasPermission("locations.manage") && location.status === "active") {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = "Archivar";
      button.addEventListener("click", async () => {
        try {
          await request(`/locations/${location.id}/archive`, { method: "POST" });
          showNotice("Ubicación archivada.");
          await loadDashboard();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(button);
    }
    list.append(card);
  }
  return locations;
}

async function loadProducts() {
  if (!hasPermission("products.read")) return [];
  const products = await request("/products");
  setOptions(document.querySelector("#slot-form [name=productId]"), products.filter((product) => product.status === "active"), {
    value: "id",
    label: (product) => `${product.name} · ${product.priceMinor} ${product.currency}`
  });
  const list = document.querySelector("#products");
  list.replaceChildren();
  for (const product of products) {
    const card = createCard(`${product.name} (${product.sku})`, `${product.priceMinor} ${product.currency} · ${product.status}`);
    if (hasPermission("products.manage") && product.status === "active") {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = "Archivar";
      button.addEventListener("click", async () => {
        try {
          await request(`/products/${product.id}/archive`, { method: "POST" });
          showNotice("Producto archivado.");
          await loadDashboard();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(button);
    }
    list.append(card);
  }
  return products;
}

async function loadMachines() {
  if (!hasPermission("machines.read")) return [];
  const machines = await request("/machines");
  setOptions(document.querySelector("#slot-form [name=machineId]"), machines, {
    value: "id",
    label: (machine) => `${machine.name} (${machine.code})`
  });
  const list = document.querySelector("#machines");
  list.replaceChildren();
  for (const machine of machines) {
    const card = createCard(`${machine.name} (${machine.code})`, `${machine.publicCode} · ${machine.status}`);
    if (hasPermission("machines.manage")) {
      const action = document.createElement("button");
      action.className = "secondary";
      action.textContent = machine.status === "active" ? "Mantenimiento" : "Activar";
      action.addEventListener("click", async () => {
        try {
          const nextAction = machine.status === "active" ? "maintenance" : "activate";
          await request(`/machines/${machine.id}/${nextAction}`, { method: "POST" });
          showNotice("Estado de máquina actualizado.");
          await loadDashboard();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(action);
    }
    if (hasPermission("machines.credentials.rotate")) {
      const rotate = document.createElement("button");
      rotate.className = "secondary";
      rotate.textContent = "Rotar clave";
      rotate.addEventListener("click", async () => {
        try {
          const result = await request(`/machines/${machine.id}/device-key/rotate`, { method: "POST", body: "{}" });
          showOneTimeSecret(`Nueva clave de dispositivo para ${machine.name}`, result.deviceKey);
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(rotate);
    }
    list.append(card);
  }
  return machines;
}

async function loadRolesAndMembers() {
  let roles = [];
  if (hasPermission("roles.read")) {
    roles = await request("/roles");
    const roleSelect = document.querySelector("#member-form [name=roleId]");
    setOptions(roleSelect, roles, { value: "id", label: (role) => role.name });
    const roleList = document.querySelector("#roles");
    roleList.replaceChildren();
    for (const role of roles) {
      roleList.append(createCard(role.name, `${role.description} · ${role.permissions.length} permisos`));
    }
    const permissionRows = await request("/permissions");
    const permissionBox = document.querySelector("#role-permissions");
    permissionBox.replaceChildren(Object.assign(document.createElement("legend"), { textContent: "Permisos" }));
    for (const permission of permissionRows) {
      const label = document.createElement("label");
      label.className = "permission-choice";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "permissions";
      checkbox.value = permission.code;
      label.append(checkbox, document.createTextNode(permission.code));
      permissionBox.append(label);
    }
  }
  if (hasPermission("members.read")) {
    const members = await request("/members");
    const memberList = document.querySelector("#members");
    memberList.replaceChildren();
    for (const member of members) {
      const card = createCard(member.displayName, `${member.email} · ${member.status} · ${member.roles.join(", ") || "sin roles"}`);
      if (hasPermission("members.manage") && member.status === "active") {
        const button = document.createElement("button");
        button.className = "secondary";
        button.textContent = "Suspender";
        button.addEventListener("click", async () => {
          try {
            await request(`/members/${member.membershipId}`, {
              method: "PATCH",
              body: JSON.stringify({ status: "suspended" })
            });
            showNotice("Membresía suspendida.");
            await loadDashboard();
          } catch (error) {
            showNotice(error.message, true);
          }
        });
        card.append(button);
      }
      memberList.append(card);
    }
  }
}

async function loadOrders() {
  if (hasPermission("orders.read")) {
    const orders = await request("/orders");
    const list = document.querySelector("#orders");
    list.replaceChildren();
    for (const order of orders) {
      const card = createCard(`${order.status} · ${order.totalMinor} ${order.currency}`,
        `${order.id} · ${new Date(order.createdAt).toLocaleString()}`);
      if (hasPermission("orders.manage") && ["pending", "awaiting_payment", "failed"].includes(order.status)) {
        const button = document.createElement("button");
        button.className = "secondary";
        button.textContent = "Cancelar";
        button.addEventListener("click", async () => {
          try {
            await request(`/orders/${order.id}/cancel`, { method: "POST", body: "{}" });
            showNotice("Orden cancelada y reserva liberada.");
            await loadDashboard();
          } catch (error) {
            showNotice(error.message, true);
          }
        });
        card.append(button);
      }
      list.append(card);
    }
    if (!orders.length) list.textContent = "No hay órdenes.";
  }
  if (hasPermission("payments.read")) {
    const payments = await request("/payments");
    const list = document.querySelector("#payments");
    list.replaceChildren();
    for (const payment of payments) {
      list.append(createCard(`${payment.status} · ${payment.amountMinor} ${payment.currency}`,
        `${payment.scenario} · ${payment.orderId}`));
    }
    if (!payments.length) list.textContent = "No hay pagos.";
  }
  if (hasPermission("dispensing.read")) {
    const jobs = await request("/dispense-jobs");
    const list = document.querySelector("#dispense-jobs");
    list.replaceChildren();
    for (const job of jobs) {
      const card = createCard(`${job.status} · intento ${job.attemptCount}`, job.id);
      if (hasPermission("dispensing.retry") && job.status === "failed") {
        const button = document.createElement("button");
        button.textContent = "Reintentar";
        button.addEventListener("click", async () => {
          try {
            await request(`/dispense-jobs/${job.id}/retry`, { method: "POST", body: "{}" });
            showNotice("Despacho reencolado.");
            await loadDashboard();
          } catch (error) {
            showNotice(error.message, true);
          }
        });
        card.append(button);
      }
      list.append(card);
    }
    if (!jobs.length) list.textContent = "No hay trabajos de despacho.";
  }
}

async function loadAudit() {
  if (!hasPermission("audit.read")) return;
  const events = await request("/audit-events?limit=20");
  const list = document.querySelector("#audit-events");
  list.replaceChildren();
  for (const event of events) {
    list.append(createCard(event.action, `${event.resourceType} · ${new Date(event.createdAt).toLocaleString()}`));
  }
  if (!events.length) list.textContent = "No hay eventos de auditoría.";
}

function showOneTimeSecret(label, value) {
  const panel = document.querySelector("#one-time-secret");
  panel.hidden = false;
  panel.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = label;
  const secret = document.createElement("code");
  secret.textContent = value;
  panel.append(heading, secret);
  showNotice("Copia la clave ahora; no volverá a mostrarse.");
}

async function loadReports() {
  if (!hasPermission("reports.read")) return;
  const values = new FormData(document.querySelector("#report-form"));
  const query = new URLSearchParams();
  if (values.get("from")) query.set("from", `${values.get("from")}T00:00:00.000Z`);
  if (values.get("to")) {
    const inclusiveEnd = new Date(`${values.get("to")}T00:00:00.000Z`);
    inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);
    query.set("to", inclusiveEnd.toISOString());
  }
  const suffix = query.size ? `?${query}` : "";
  const [sales, consumption, inventoryReport, payments, dispensing, machines] = await Promise.all([
    request(`/reports/sales${suffix}`),
    request(`/reports/consumption${suffix}`),
    request("/reports/inventory"),
    request(`/reports/payments${suffix}`),
    request(`/reports/dispensing${suffix}`),
    request(`/reports/machines${suffix}`)
  ]);
  document.querySelector("#reports").textContent = JSON.stringify({
    sales, consumption, inventory: inventoryReport, payments, dispensing, machines
  }, null, 2);
}

async function loadDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  try {
    const [me, tenants] = await Promise.all([request("/auth/me"), request("/auth/tenants")]);
    currentTenantId = me.tenant_id;
    permissions = new Set(me.permissions);
    document.querySelector("#tenant-name").textContent = me.tenant_name;
    setOptions(tenantSelect, tenants, { value: "id", label: (tenant) => `${tenant.name} · ${tenant.status}` });
    tenantSelect.value = currentTenantId;
    showPermissionSections();
    document.querySelector("#member-form").hidden = !hasPermission("roles.read");
    document.querySelector("#role-form").hidden = !hasPermission("roles.read");

    const overview = hasPermission("reports.read") ? await request("/reports/overview") : null;
    document.querySelector("#overview").textContent = overview
      ? JSON.stringify(overview, null, 2)
      : "Tu rol no permite consultar reportes.";
    const [, locations, products, machines] = await Promise.all([
      loadInventory(),
      loadLocations(),
      loadProducts(),
      loadMachines()
    ]);
    await loadRolesAndMembers();
    await Promise.all([loadOrders(), loadAudit()]);
    if (hasPermission("reports.read")) await loadReports();
    const secret = document.querySelector("#one-time-secret");
    secret.hidden = true;
    if (locations?.length === 0 || products?.length === 0 || machines?.length === 0) {
      showNotice("Tenant listo. Configura ubicación, producto, máquina y slot para operar.");
    } else {
      showNotice("Datos cargados desde el tenant activo.");
    }
  } catch (error) {
    showNotice(error.message, true);
    if (/token|membresía|membership|autenticación|authentication/i.test(error.message)) logout();
  }
}

function logout() {
  const previousRefreshToken = refreshToken;
  clearSession();
  if (previousRefreshToken) {
    void fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: previousRefreshToken })
    }).catch(() => showNotice("No se pudo confirmar el cierre de sesión en el servidor.", true));
  }
}

function clearSession() {
  token = null;
  currentTenantId = undefined;
  refreshToken = null;
  permissions = new Set();
  sessionStorage.removeItem("m24-admin-token");
  sessionStorage.removeItem("m24-admin-refresh");
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(loginForm);
  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: values.get("email"), password: values.get("password") })
    });
    token = result.accessToken;
    refreshToken = result.refreshToken;
    sessionStorage.setItem("m24-admin-token", token);
    sessionStorage.setItem("m24-admin-refresh", refreshToken);
    loginForm.reset();
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

tenantSelect.addEventListener("change", async () => {
  if (!tenantSelect.value || tenantSelect.value === currentTenantId) return;
  try {
    const result = await request("/auth/switch-tenant", {
      method: "POST",
      body: JSON.stringify({ tenantId: tenantSelect.value, refreshToken })
    });
    token = result.accessToken;
    refreshToken = result.refreshToken;
    sessionStorage.setItem("m24-admin-token", token);
    sessionStorage.setItem("m24-admin-refresh", refreshToken);
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#location-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request("/locations", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(values))
    });
    event.currentTarget.reset();
    showNotice("Ubicación creada.");
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    await request("/products", {
      method: "POST",
      body: JSON.stringify({
        ...Object.fromEntries(values),
        priceMinor: Number(values.get("priceMinor"))
      })
    });
    event.currentTarget.reset();
    showNotice("Producto creado.");
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#machine-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    const machine = await request("/machines", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(values))
    });
    event.currentTarget.reset();
    await loadDashboard();
    showOneTimeSecret(`Máquina ${machine.name}. Guarda esta clave de dispositivo`, machine.deviceKey);
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#slot-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    const machineId = values.get("machineId");
    await request(`/machines/${machineId}/slots`, {
      method: "POST",
      body: JSON.stringify({
        position: values.get("position"),
        productId: values.get("productId"),
        capacity: Number(values.get("capacity"))
      })
    });
    event.currentTarget.reset();
    showNotice("Slot creado. Usa el panel de inventario para abastecerlo.");
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#member-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  try {
    const body = {
      email: values.get("email"),
      displayName: values.get("displayName"),
      roleIds: [values.get("roleId")]
    };
    if (values.get("password")) body.password = values.get("password");
    await request("/members", { method: "POST", body: JSON.stringify(body) });
    event.currentTarget.reset();
    showNotice("Miembro agregado al tenant.");
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#role-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const selectedPermissions = [...event.currentTarget.querySelectorAll("[name=permissions]:checked")]
    .map((checkbox) => checkbox.value);
  try {
    await request("/roles", {
      method: "POST",
      body: JSON.stringify({
        name: values.get("name"),
        description: values.get("description"),
        permissions: selectedPermissions
      })
    });
    event.currentTarget.reset();
    showNotice("Rol creado.");
    await loadDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#report-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loadReports();
    showNotice("Reportes actualizados.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#logout").addEventListener("click", logout);
if (token) void loadDashboard();
