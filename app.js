// ===============================
// CONFIG
// ===============================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

// ===============================
// DOM
// ===============================
const ventasContainer = document.getElementById("ventas-container");
const comprasContainer = document.getElementById("compras-container");
const ventasCountEl = document.getElementById("ventas-count");
const comprasCountEl = document.getElementById("compras-count");
const lastUpdatedEl = document.getElementById("last-updated");
const refreshBtn = document.getElementById("refresh-btn");

// ===============================
// EVENT LOGIC
// ===============================
function shouldTriggerEvent(symbol, signal, target) {
  const now = Date.now();

  const saved =
    JSON.parse(localStorage.getItem(symbol)) || {
      lastSignal: "",
      lastTarget: null,
      lastEventAt: 0
    };

  // Sin señal → no evento
  if (!signal) return false;

  // Cambio de señal → EVENTO
  if (saved.lastSignal !== signal) {
    save(symbol, signal, target, now);
    return true;
  }

  // Cambio de objetivo → EVENTO (TU decisión)
  if (saved.lastTarget !== target && target !== null) {
    save(symbol, signal, target, now);
    return true;
  }

  // Cooldown
  if (now - saved.lastEventAt < COOLDOWN_MS) {
    return false;
  }

  // Misma señal, fuera de cooldown → EVENTO
  save(symbol, signal, target, now);
  return true;
}

function save(symbol, signal, target, time) {
  localStorage.setItem(
    symbol,
    JSON.stringify({
      lastSignal: signal,
      lastTarget: target,
      lastEventAt: time
    })
  );
}

// ===============================
// FETCH + RENDER
// ===============================
async function fetchSignals() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const ventas = [];
    const compras = [];

    data.forEach(item => {
      if (item.signal === "VENTA") ventas.push(item);
      if (item.signal === "COMPRA") compras.push(item);

      const target =
        item.signal === "VENTA" ? item.targetSell : item.targetBuy;

      if (shouldTriggerEvent(item.symbol, item.signal, target)) {
        console.log(
          `🔔 EVENTO → ${item.symbol} ${item.signal} (objetivo ${target})`
        );
      }
    });

    renderCards(ventasContainer, ventas, "VENTA");
    renderCards(comprasContainer, compras, "COMPRA");

    ventasCountEl.textContent = `🔻 Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `🔺 Compras: ${compras.length}`;

    const now = new Date();
    lastUpdatedEl.textContent =
      "Última actualización: " +
      now.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
  } catch (err) {
    console.error("Error al traer datos:", err);
    lastUpdatedEl.textContent = "Error al actualizar";
  }
}

// ===============================
// UI
// ===============================
function renderCards(container, list, tipo) {
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML =
      "<div class='empty'>Sin señales activas.</div>";
    return;
  }

  list.forEach(item => {
    const target =
      tipo === "VENTA" ? item.targetSell : item.targetBuy;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header">
        <strong>${item.symbol}</strong>
        <span class="chip ${tipo.toLowerCase()}">${tipo}</span>
      </div>
      <div class="card-body">
        <div>Actual: ${format(item.price)}</div>
        <div>Objetivo: ${format(target)}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

function format(val) {
  if (val === null || val === undefined || val === "") return "-";
  return Number(val).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

// ===============================
// UPDATE BUTTON
// ===============================
async function actualizarSheet() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Actualizando…";

  try {
    await fetch(API_URL + "?action=update", {
      method: "POST",
      mode: "no-cors"
    });

    setTimeout(fetchSignals, 1500);
  } catch (err) {
    console.error("Error update:", err);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "ACTUALIZAR AHORA";
  }
}

refreshBtn.addEventListener("click", actualizarSheet);

// ===============================
// AUTO REFRESH
// ===============================
fetchSignals();
setInterval(fetchSignals, 15 * 60 * 1000);
