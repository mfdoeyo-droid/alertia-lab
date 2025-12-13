// ===============================
// CONFIG
// ===============================
const API_URL =
  "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

// ===============================
// STORAGE KEYS
// ===============================
const ALERTIA_INIT_KEY = "alertia_initialized";
const ALERTIA_PREV_KEY = "alertia_prev_signals_v1"; // { BTC: "COMPRA"|"VENTA"|"-", ... }
const ALERTIA_LAST_NOTIF_KEY = "alertia_last_notified_v1"; // { "BTC_COMPRA": timestamp, "BTC_VENTA": timestamp, ... }

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
// INIT CONTROL
// ===============================
function isFirstRun() {
  return localStorage.getItem(ALERTIA_INIT_KEY) !== "true";
}
function markInitialized() {
  localStorage.setItem(ALERTIA_INIT_KEY, "true");
}

// ===============================
// STORAGE HELPERS
// ===============================
function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

function getPrevSignals() {
  return readJSON(ALERTIA_PREV_KEY, {});
}
function setPrevSignals(map) {
  writeJSON(ALERTIA_PREV_KEY, map);
}

function getLastNotified() {
  return readJSON(ALERTIA_LAST_NOTIF_KEY, {});
}
function setLastNotified(map) {
  writeJSON(ALERTIA_LAST_NOTIF_KEY, map);
}

// ===============================
// FORMAT
// ===============================
function formatNumber(val) {
  if (val === null || val === undefined || val === "" || isNaN(val)) return "-";
  return Number(val).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

// ===============================
// RENDER
// ===============================
function renderCards(container, list, tipo) {
  container.innerHTML = "";

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty">Sin señales activas.</div>`;
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "card " + (tipo === "VENTA" ? "card-venta" : "card-compra");

    const target = tipo === "VENTA" ? item.targetSell : item.targetBuy;
    const labelObj = tipo === "VENTA" ? "Objetivo venta" : "Objetivo compra";

    card.innerHTML = `
      <div class="card-header">
        <b>${item.symbol ?? "-"}</b>
        <span>${tipo}</span>
      </div>
      <div class="card-body">
        <div>Precio actual: ${formatNumber(item.price)}</div>
        <div>${labelObj}: ${formatNumber(target)}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ===============================
// NOTIFICATIONS (LOCAL)
// ===============================
async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  // Pedimos permiso cuando efectivamente lo necesitamos (cuando hay algo para notificar)
  const res = await Notification.requestPermission();
  return res === "granted";
}

function notifySignal(item) {
  const isVenta = item.signal === "VENTA";
  const title = isVenta ? `🔴 VENTA — ${item.symbol}` : `🟢 COMPRA — ${item.symbol}`;

  const objetivo = isVenta ? item.targetSell : item.targetBuy;
  const labelObj = isVenta ? "Objetivo venta" : "Objetivo compra";

  const body = [
    `Actual: ${formatNumber(item.price)}`,
    `${labelObj}: ${formatNumber(objetivo)}`
  ].join("\n");

  // tag evita que se apilen duplicadas en algunos Android
  new Notification(title, {
    body,
    tag: `${item.symbol}_${item.signal}`,
    renotify: false
  });
}

/**
 * Reglas implementadas (tus reglas):
 * - Primera vez que abre la app: NO notificar.
 * - Notificar SOLO cuando aparece señal nueva o cambia el tipo.
 * - Cambio COMPRA↔VENTA SIEMPRE notifica (sin cooldown).
 * - Si reaparece el MISMO tipo dentro de 1h (COMPRA→-→COMPRA): NO notificar.
 * - Cooldown es por moneda y por tipo.
 */
async function processNotifications(data) {
  // 2A: primera apertura no notifica, solo sembramos estado
  if (isFirstRun()) return;

  // Filtramos solo señales “reales”
  const current = {};
  const bySymbol = {}; // para notificar con el objeto completo
  data.forEach(item => {
    const s = item?.symbol;
    const sig = item?.signal;
    if (!s) return;
    if (sig === "COMPRA" || sig === "VENTA") {
      current[s] = sig;
      bySymbol[s] = item;
    }
  });

  const prev = getPrevSignals();       // {symbol: "COMPRA"/"VENTA"/"-"}
  const lastNotified = getLastNotified(); // {"BTC_COMPRA": ts, ...}
  const now = Date.now();

  // Detectar cambios por símbolo
  const allSymbols = new Set([...Object.keys(prev), ...Object.keys(current)]);

  // Pedimos permiso solo si efectivamente habría notificaciones
  let needsPermission = false;

  // Primero decidimos qué notificar
  const toNotify = [];

  allSymbols.forEach(symbol => {
    const prevSig = prev[symbol] || "-";
    const currSig = current[symbol] || "-";

    // No avisamos cierres (COMPRA/VENTA -> "-") por ahora
    if (currSig === "-") return;

    // Si no cambió, no notifica
    if (prevSig === currSig) return;

    // Si cambió tipo (COMPRA<->VENTA), SIEMPRE notifica
    if (
      (prevSig === "COMPRA" && currSig === "VENTA") ||
      (prevSig === "VENTA" && currSig === "COMPRA")
    ) {
      toNotify.push(bySymbol[symbol]);
      needsPermission = true;
      // y marcamos timestamp para ese tipo (para mantener mapa consistente)
      lastNotified[`${symbol}_${currSig}`] = now;
      return;
    }

    // Caso: "-" -> COMPRA/VENTA  (o algo distinto a mismo tipo)
    // Aplica cooldown por símbolo+tipo
    const key = `${symbol}_${currSig}`;
    const lastTs = lastNotified[key] || 0;

    if (now - lastTs >= COOLDOWN_MS) {
      toNotify.push(bySymbol[symbol]);
      needsPermission = true;
      lastNotified[key] = now;
    } else {
      // Dentro del cooldown: NO notifica
    }
  });

  // Si no hay nada para notificar, guardamos estado y listo
  if (toNotify.length === 0) {
    setPrevSignals(buildPrevMap(current));
    setLastNotified(lastNotified);
    return;
  }

  // Pedimos permiso si hace falta
  const ok = needsPermission ? await ensureNotificationPermission() : false;

  // Notificamos solo si hay permiso
  if (ok) {
    toNotify.forEach(item => notifySignal(item));
  }

  // Guardamos estado
  setPrevSignals(buildPrevMap(current));
  setLastNotified(lastNotified);
}

function buildPrevMap(currentActiveMap) {
  // Guardamos solo estado por símbolo:
  // si no está activo -> "-"
  const prev = getPrevSignals();
  const out = { ...prev };
  const symbols = new Set([...Object.keys(out), ...Object.keys(currentActiveMap)]);
  symbols.forEach(sym => {
    out[sym] = currentActiveMap[sym] || "-";
  });
  return out;
}

// ===============================
// FETCH + UPDATE + LOOP
// ===============================
async function fetchSignals() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Separar en ventas/compras
    const ventas = data.filter(x => x.signal === "VENTA");
    const compras = data.filter(x => x.signal === "COMPRA");

    renderCards(ventasContainer, ventas, "VENTA");
    renderCards(comprasContainer, compras, "COMPRA");

    ventasCountEl.textContent = `🔻 Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `🔺 Compras: ${compras.length}`;

    const now = new Date();
    lastUpdatedEl.textContent =
      "Última actualización: " +
      now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // 2A: primera apertura no notifica, pero SEMBRAMOS estado
    if (isFirstRun()) {
      // Sembrar prev con lo que hay ahora (para que después no notifique “lo mismo”)
      const current = {};
      data.forEach(item => {
        const s = item?.symbol;
        const sig = item?.signal;
        if (!s) return;
        if (sig === "COMPRA" || sig === "VENTA") current[s] = sig;
      });
      setPrevSignals(buildPrevMap(current));
      markInitialized();
      return;
    }

    // Notificaciones (solo en refresh, 4A)
    await processNotifications(data);

  } catch (err) {
    console.error("Error al traer señales:", err);
    lastUpdatedEl.textContent = "Error al actualizar datos";
  }
}

async function actualizarSheet() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";

    await fetch(API_URL + "?action=update", {
      method: "POST",
      mode: "no-cors"
    });

    await new Promise(r => setTimeout(r, 1500));
    await fetchSignals();

  } catch (err) {
    console.error("Error al actualizar:", err);
    alert("Error al actualizar el Sheet");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "ACTUALIZAR AHORA";
  }
}

refreshBtn.addEventListener("click", actualizarSheet);

// Primera carga + auto-refresh
fetchSignals();
setInterval(fetchSignals, 15 * 60 * 1000);
