// 🔗 API (NO TOCAR)
const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

// === DOM ===
const ventasContainer = document.getElementById("ventas-container");
const comprasContainer = document.getElementById("compras-container");
const ventasCountEl = document.getElementById("ventas-count");
const comprasCountEl = document.getElementById("compras-count");
const lastUpdatedEl = document.getElementById("last-updated");
const refreshBtn = document.getElementById("refresh-btn");

// === UTILS ===
function formatNumber(val) {
  if (val === null || val === undefined || val === "" || isNaN(val)) return "-";
  return Number(val).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

// === RENDER ===
function renderCards(container, list, tipo) {
  container.innerHTML = "";

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="card">Sin señales activas</div>`;
    return;
  }

  list.forEach(item => {
    const precioActual = formatNumber(item.price);
    const objetivo =
      tipo === "VENTA"
        ? formatNumber(item.targetSell)
        : formatNumber(item.targetBuy);

    const labelObjetivo =
      tipo === "VENTA" ? "Objetivo venta" : "Objetivo compra";

    container.innerHTML += `
      <div class="card ${tipo === "VENTA" ? "card-venta" : "card-compra"}">
        <div><b>${item.symbol}</b></div>
        <div>Precio actual: ${precioActual}</div>
        <div>${labelObjetivo}: ${objetivo}</div>
      </div>
    `;
  });
}

// === GET DATOS ===
async function fetchSignals() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const ventas = data.filter(x => x.signal === "VENTA");
    const compras = data.filter(x => x.signal === "COMPRA");

    ventasCountEl.textContent = `🔻 Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `🔺 Compras: ${compras.length}`;

    renderCards(ventasContainer, ventas, "VENTA");
    renderCards(comprasContainer, compras, "COMPRA");

    const timeStr = new Date().toLocaleString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    lastUpdatedEl.textContent = `Última actualización: ${timeStr}`;
  } catch (err) {
    console.error("Error al traer señales:", err);
    lastUpdatedEl.textContent = "Error al actualizar datos";
  }
}

// === POST UPDATE (IMITA APP A) ===
async function actualizarSheet() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";

    // POST vacío → dispara doPost() en Apps Script
    await fetch(API_URL + "?action=update", {
      method: "POST",
      mode: "no-cors"
    });

    // Espera para que el Sheet termine de escribir
    await new Promise(r => setTimeout(r, 1500));

    await fetchSignals();
    lastUpdatedEl.textContent += " ✔";

  } catch (err) {
    console.error("Error al actualizar:", err);
    alert("Error al actualizar el Sheet");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "ACTUALIZAR AHORA";
  }
}

// === EVENTOS ===
refreshBtn.addEventListener("click", actualizarSheet);

// === CARGA INICIAL ===
fetchSignals();

// === AUTO-REFRESH (15 min) ===
setInterval(fetchSignals, 15 * 60 * 1000);
