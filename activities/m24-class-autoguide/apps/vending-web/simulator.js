const API = "/api/v1";
const form = document.querySelector("#connect-form");
const notice = document.querySelector("#notice");
const jobNode = document.querySelector("#job");
const stateNode = document.querySelector("#state");
const successButton = document.querySelector("#success");
const failureButton = document.querySelector("#failure");
let token = null;
let currentJob = null;
let pollTimer = null;
let heartbeatTimer = null;

function say(message, error = false) {
  notice.textContent = message;
  notice.classList.toggle("error", error);
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? `Solicitud fallida (${response.status}).`);
  return body.data;
}

async function poll() {
  if (!token) return;
  try {
    const job = await request("/devices/jobs/next");
    if (job) {
      currentJob = job;
      jobNode.textContent = JSON.stringify(job, null, 2);
      successButton.disabled = false;
      failureButton.disabled = false;
      say("Trabajo reclamado por esta máquina.");
      stateNode.textContent = "Procesando despacho";
      return;
    }
    stateNode.textContent = "En línea · sin trabajos pendientes";
  } catch (error) {
    say(error.message, true);
    stateNode.textContent = "Error de conexión";
  }
}

async function finish(path, body) {
  if (!currentJob) return;
  try {
    const result = await request(`/devices/jobs/${currentJob.id}/${path}`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    jobNode.textContent = JSON.stringify(result, null, 2);
    currentJob = null;
    successButton.disabled = true;
    failureButton.disabled = true;
    say(path === "complete" ? "Despacho confirmado; inventario actualizado." : "Fallo registrado; el inventario queda reservado para posible reintento.");
    stateNode.textContent = "En línea";
    void poll();
  } catch (error) {
    say(error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const publicCode = values.get("publicCode");
  try {
    const auth = await request("/devices/authenticate", {
      method: "POST",
      body: JSON.stringify({ publicCode, deviceKey: values.get("deviceKey") })
    });
    token = auth.accessToken;
    document.querySelector("#machine-qr").src = `/api/v1/public/machines/${encodeURIComponent(publicCode)}/qr`;
    document.querySelector("#qr-panel").hidden = false;
    stateNode.textContent = "Autenticada";
    say("Máquina autenticada. Iniciando heartbeat y polling.");
    await request("/devices/heartbeat", { method: "POST", body: JSON.stringify({ softwareVersion: "m24-simulator/1.0" }) });
    clearInterval(pollTimer);
    clearInterval(heartbeatTimer);
    await poll();
    pollTimer = setInterval(() => void poll(), 3000);
    heartbeatTimer = setInterval(() => {
      void request("/devices/heartbeat", { method: "POST", body: JSON.stringify({ softwareVersion: "m24-simulator/1.0" }) })
        .catch((error) => say(error.message, true));
    }, 30_000);
  } catch (error) {
    token = null;
    say(error.message, true);
  }
});

successButton.addEventListener("click", () => void finish("complete", {}));
failureButton.addEventListener("click", () => void finish("fail", { failureCode: "SIMULATED_MECHANICAL_FAILURE" }));
