// === CONFIG ===
// TU API (Apps Script Web App) - la que ya funciona con GET y POST
const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

// === DOM ===
const ventasContainer = document.getElementById("ventas-container");
const comprasContainer = document.getElementById("compras-container");
const ventasCountEl = document.getElementById("ventas-count");
const comprasCountEl = document.getElementById("compras-count");
const lastUpdatedEl = document.getElementById("last-updated");
const statusTextEl = document.getElementById("status-text");
const refreshBtn = document.getElementById("refresh-btn");

const overlay = document.getElementById("loader-overlay");
const loaderText = document.getElementById("loader-text");

function showLoader(msg){
  loaderText.textContent = msg || "Actualizando…";
  overlay.classList.remove("hidden");
}
function hideLoader(){
  overlay.classList.add("hidden");
}

function fmt(n){
  if (n === "" || n === null || typeof n === "undefined") return "-";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  // formato ES-AR, pero sin romper si es muy chico
  return num.toLocaleString("es-AR", { maximumFractionDigits: 8 });
}

function setStatus(msg){
  statusTextEl.textContent = msg || "";
}

function renderEmpty(container){
  container.innerHTML = `<div class="card"><div class="small">Sin señales activas.</div></div>`;
}

function renderCards(container, list, tipo){
  container.innerHTML = "";
  if (!list || list.length === 0) return renderEmpty(container);

  list.forEach(item => {
    const symbol = item.symbol || "-";
    const price = item.price;
    const variation = item.variation; // viene como decimal (ej: -0.0123 = -1.23%)
    const target = (tipo === "VENTA") ? item.targetSell : item.targetBuy;

    const varPct = (typeof variation === "number")
      ? (variation * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })
      : "-";

    const badgeClass = (tipo === "VENTA") ? "sell" : "buy";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row">
        <div style="font-weight:900; font-size:16px;">${symbol}</div>
        <div class="badge ${badgeClass}">${tipo}</div>
      </div>
      <div class="small mono">Actual: ${fmt(price)} | Objetivo: ${fmt(target)}</div>
      <div class="small mono">24h: ${varPct}%</div>
    `;
    container.appendChild(card);
  });
}

async function fetchSignals(){
  const res = await fetch(API_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function postUpdateSheet(){
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update" })
  });
  if (!res.ok) throw new Error(`POST ${res.status}`);
  const out = await res.json().catch(() => ({}));
  if (!out || out.ok !== true) throw new Error(out.error || "POST ok=false");
}

function nowTime(){
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

async function refresh({alsoUpdateSheet=false} = {}){
  try{
    refreshBtn.disabled = true;
    setStatus("");

    showLoader(alsoUpdateSheet ? "Actualizando Sheet + App…" : "Actualizando App…");

    if (alsoUpdateSheet){
      // 1) Primero dispara update del sheet
      await postUpdateSheet();
      // 2) Espera corta para que alcance a escribir (evita “actualicé y aún no cambió”)
      await new Promise(r => setTimeout(r, 1200));
    }

    // 3) Trae señales
    const data = await fetchSignals();

    const ventas = data.filter(x => x.signal === "VENTA");
    const compras = data.filter(x => x.signal === "COMPRA");

    ventasCountEl.textContent = `Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `Compras: ${compras.length}`;
    lastUpdatedEl.textContent = `Última actualización: ${nowTime()}`;

    renderCards(ventasContainer, ventas, "VENTA");
    renderCards(comprasContainer, compras, "COMPRA");

    setStatus(alsoUpdateSheet ? "Sheet actualizado + datos refrescados." : "Datos refrescados.");
  } catch(err){
    console.error(err);
    setStatus("Error al actualizar datos.");
  } finally{
    hideLoader();
    refreshBtn.disabled = false;
  }
}

// Click: ACTUALIZAR AHORA = actualiza sheet + refresca app
refreshBtn.addEventListener("click", () => refresh({ alsoUpdateSheet: true }));

// Carga inicial: solo refresca app (sin tocar sheet)
refresh({ alsoUpdateSheet: false });
