const API = "/api/v1";
const params = new URLSearchParams(location.search);
const publicCode = params.get("machine") || "mach-demo-alpha-01";
const notice = document.querySelector("#notice");
const catalogNode = document.querySelector("#catalog");
let selectedSlot = null;
let publicToken = sessionStorage.getItem(`m24-order-${publicCode}`);

function say(message, error = false) {
  notice.textContent = message;
  notice.classList.toggle("error", error);
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? `Solicitud fallida (${response.status}).`);
  return body.data;
}

function renderCatalog(items) {
  catalogNode.replaceChildren();
  for (const item of items) {
    const card = document.createElement("article");
    card.className = "product panel";
    const name = document.createElement("h2");
    name.textContent = item.product.name;
    const details = document.createElement("p");
    details.textContent = `${(item.priceMinor / 100).toFixed(2)} ${item.product.currency} · Disponibles: ${item.available}`;
    const button = document.createElement("button");
    button.textContent = item.available > 0 ? "Agregar al pedido" : "Agotado";
    button.disabled = item.available < 1;
    button.addEventListener("click", () => {
      selectedSlot = item;
      document.querySelector("#order-summary").textContent =
        `${item.product.name} × 1 — ${(item.priceMinor / 100).toFixed(2)} ${item.product.currency}`;
      document.querySelector("#checkout").hidden = false;
      say("Producto agregado. La reserva se crea al confirmar el pedido.");
    });
    card.append(name, details, button);
    catalogNode.append(card);
  }
}

async function createOrder() {
  if (!selectedSlot) throw new Error("Agrega un producto antes de continuar.");
  const key = crypto.randomUUID();
  const result = await request(`/public/machines/${encodeURIComponent(publicCode)}/orders`, {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: JSON.stringify({ items: [{ slotId: selectedSlot.slotId, quantity: 1 }] })
  });
  publicToken = result.publicToken;
  sessionStorage.setItem(`m24-order-${publicCode}`, publicToken);
  document.querySelector("#tracking").hidden = false;
  document.querySelector("#order-status").textContent = JSON.stringify(result.order, null, 2);
  return result;
}

async function pay(outcome) {
  try {
    if (!publicToken) await createOrder();
    const paymentKey = crypto.randomUUID();
    const result = await request(`/public/orders/${encodeURIComponent(publicToken)}/payments/simulate`, {
      method: "POST",
      headers: { "Idempotency-Key": paymentKey },
      body: JSON.stringify({ outcome })
    });
    say(`Pago ${result.status}. Sigue el estado del despacho a continuación.`);
    await updateTracking();
  } catch (error) {
    say(error.message, true);
  }
}

async function updateTracking() {
  if (!publicToken) return;
  try {
    const order = await request(`/public/orders/${encodeURIComponent(publicToken)}`);
    document.querySelector("#tracking").hidden = false;
    document.querySelector("#order-status").textContent = JSON.stringify(order, null, 2);
    if (["completed", "cancelled", "expired"].includes(order.status)) clearInterval(poll);
  } catch (error) {
    say(error.message, true);
  }
}

document.querySelector("#pay").addEventListener("click", () => void pay("approved"));
document.querySelector("#decline").addEventListener("click", () => void pay("declined"));
let poll;

try {
  const [machine, catalog] = await Promise.all([
    request(`/public/machines/${encodeURIComponent(publicCode)}`),
    request(`/public/machines/${encodeURIComponent(publicCode)}/catalog`)
  ]);
  document.querySelector("#machine-name").textContent = machine.name;
  document.querySelector("#machine-location").textContent = machine.locationName;
  renderCatalog(catalog.items);
  if (publicToken) {
    await updateTracking();
    poll = setInterval(() => void updateTracking(), 3000);
  }
} catch (error) {
  say(error.message, true);
}
