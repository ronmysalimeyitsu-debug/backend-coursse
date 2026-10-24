const API = "/api/v1";
const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const tenantForm = document.querySelector("#tenant-form");
const notice = document.querySelector("#notice");
const loginNotice = document.querySelector("#login-notice");
const tenantList = document.querySelector("#tenants");
let token = sessionStorage.getItem("m24-platform-token");

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? `Solicitud fallida (${response.status}).`);
  return body?.data;
}

function showNotice(message, isError = false) {
  const target = dashboard.hidden ? loginNotice : notice;
  target.textContent = message;
  target.classList.toggle("error", isError);
}

function logout() {
  token = null;
  sessionStorage.removeItem("m24-platform-token");
  dashboard.hidden = true;
  loginPanel.hidden = false;
  tenantList.replaceChildren();
}

function renderTenants(tenants) {
  tenantList.replaceChildren();
  for (const tenant of tenants) {
    const card = document.createElement("article");
    card.className = "stock-card";
    const title = document.createElement("strong");
    title.textContent = `${tenant.name} (${tenant.slug})`;
    const status = document.createElement("span");
    status.textContent = `Estado: ${tenant.status}`;
    card.append(title, status);
    if (tenant.status !== "archived") {
      const button = document.createElement("button");
      button.className = "secondary";
      button.textContent = tenant.status === "active" ? "Suspender" : "Reactivar";
      button.addEventListener("click", async () => {
        const action = tenant.status === "active" ? "suspend" : "activate";
        try {
          await request(`/platform/tenants/${encodeURIComponent(tenant.id)}/${action}`, { method: "POST" });
          showNotice(`Tenant ${tenant.slug}: estado actualizado.`);
          await loadTenants();
        } catch (error) {
          showNotice(error.message, true);
        }
      });
      card.append(button);
    }
    tenantList.append(card);
  }
}

async function loadTenants() {
  const tenants = await request("/platform/tenants");
  renderTenants(tenants);
}

async function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  try {
    await loadTenants();
    showNotice("Administración global lista.");
  } catch (error) {
    showNotice(error.message, true);
    if (/token|autenticación|authentication/i.test(error.message)) logout();
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(loginForm);
  try {
    const result = await request("/platform/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: values.get("email"), password: values.get("password") })
    });
    token = result.accessToken;
    sessionStorage.setItem("m24-platform-token", token);
    await showDashboard();
  } catch (error) {
    showNotice(error.message, true);
  }
});

tenantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(tenantForm);
  try {
    await request("/platform/tenants", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(values))
    });
    tenantForm.reset();
    showNotice("Tenant y administrador creados.");
    await loadTenants();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#reload-tenants").addEventListener("click", async () => {
  try {
    await loadTenants();
    showNotice("Lista de tenants actualizada.");
  } catch (error) {
    showNotice(error.message, true);
  }
});
document.querySelector("#logout").addEventListener("click", logout);
if (token) void showDashboard();
