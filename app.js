// ===============================
// CONFIG
// ===============================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

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
// HELPERS
// ===============================
function format(val) {
  if (val === null || val === undefined || val === "" || isNaN(val)) return "-";
  return Number(val).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

// % de cercanía al objetivo
function percentToTarget(price, target, tipo) {
  if (!price || !target) return Infinity;

  if (tipo === "COMPRA") {
    // cuanto más alto, más cerca
    return Math.abs((price - target) / target);
  } else {
    // VENTA: cuanto más bajo, más cerca
    return Math.abs((target - price) / target);
  }
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
    });

    // Orden por cercanía porcentual al objetivo
    ventas.sort((a, b) => {
      const da = percentToTarget(a.price, a.targetSell, "VENTA");
      const db = percentToTarget(b.price, b.targetSell, "VENTA");
      return da - db;
    });

    compras.sort((a, b) => {
      const da = percentToTarget(a.price, a.targetBuy, "COMPRA");
      const db = percentToTarget(b.price, b.targetBuy, "COMPRA");
      return da - db;
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
// INIT
// ===============================
fetchSignals();
setInterval(fetchSignals, 15 * 60 * 1000);
