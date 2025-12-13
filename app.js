// 🔗 TU API:
const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";


const ventasContainer = document.getElementById("ventas-container");
const comprasContainer = document.getElementById("compras-container");
const ventasCountEl = document.getElementById("ventas-count");
const comprasCountEl = document.getElementById("compras-count");
const lastUpdatedEl = document.getElementById("last-updated");
const refreshBtn = document.getElementById("refresh-btn");

const loaderOverlay = document.getElementById("loader-overlay");
const loaderText = document.getElementById("loader-text");

function showLoader(message = "Actualizando datos…") {
  loaderText.textContent = message;
  loaderOverlay.classList.remove("hidden");
}

function hideLoader() {
  loaderOverlay.classList.add("hidden");
}

async function fetchSignals() {
  try {
    const now = new Date();
    const res = await fetch(API_URL);
    const data = await res.json();

    // data es un array tipo:
    // { symbol, price, variation, targetBuy, targetSell, signal }

    const ventas = [];
    const compras = [];

    data.forEach(item => {
      if (item.signal === "VENTA") {
        ventas.push(item);
      } else if (item.signal === "COMPRA") {
        compras.push(item);
      }
    });

    // Orden: por cercanía al objetivo (absoluta)
    const sortByDist = (a, b) => {
      const targetA = a.signal === "VENTA" ? a.targetSell : a.targetBuy;
      const targetB = b.signal === "VENTA" ? b.targetSell : b.targetBuy;
      if (!targetA || !targetB) return 0;
      const distA = Math.abs(a.price - targetA);
      const distB = Math.abs(b.price - targetB);
      return distA - distB;
    };

    ventas.sort(sortByDist);
    compras.sort(sortByDist);

    renderCards(ventasContainer, ventas, "VENTA");
    renderCards(comprasContainer, compras, "COMPRA");

    ventasCountEl.textContent = `🔻 Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `🔺 Compras: ${compras.length}`;

    const timeStr = now.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    lastUpdatedEl.textContent = `Última actualización: ${timeStr}`;
  } catch (err) {
    console.error("Error al traer señales:", err);
    lastUpdatedEl.textContent = "Error al actualizar datos";
  }
}

function renderCards(container, list, tipo) {
  container.innerHTML = "";

  if (!list || list.length === 0) {
    const empty = document.createElement("div");
    empty.style.fontSize = "0.8rem";
    empty.style.opacity = "0.7";
    empty.textContent = "Sin señales activas.";
    container.appendChild(empty);
    return;
  }

  list.forEach(item => {
    const card = document.createElement("article");
    card.classList.add("card");
    card.classList.add(tipo === "VENTA" ? "card-venta" : "card-compra");

    const header = document.createElement("div");
    header.classList.add("card-header");

    const symbolEl = document.createElement("div");
    symbolEl.classList.add("card-symbol");
    symbolEl.textContent = item.symbol || "-";

    const chip = document.createElement("div");
    chip.classList.add("card-chip");
    chip.textContent = tipo;

    header.appendChild(symbolEl);
    header.appendChild(chip);

    const body = document.createElement("div");
    body.classList.add("card-body");

    const actual = item.price ?? "-";
    const target =
      tipo === "VENTA"
        ? (item.targetSell ?? "-")
        : (item.targetBuy ?? "-");

    const line1 = document.createElement("div");
    const line2 = document.createElement("div");

    line1.textContent = `Actual: ${formatNumber(actual)}`;
    if (tipo === "VENTA") {
      line2.textContent = `Objetivo Venta: ${formatNumber(target)}`;
    } else {
      line2.textContent = `Objetivo Compra: ${formatNumber(target)}`;
    }

    body.appendChild(line1);
    body.appendChild(line2);

    card.appendChild(header);
    card.appendChild(body);

    container.appendChild(card);
  });
}

function formatNumber(val) {
  if (val === null || val === undefined || val === "" || isNaN(val)) {
    return "-";
  }
  const num = Number(val);
  // Si es >= 1000, menos decimales.
  const opts = num >= 1000
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 6 };

  return num.toLocaleString("es-AR", opts);
}

// Botón "ACTUALIZAR AHORA" → POST a tu script (disparar updateCrypto)
async function triggerUpdate() {
  showLoader("Actualizando hoja de precios…");

  try {
    const body = JSON.stringify({ action: "update" });

    // Apps Script NO responde CORS...
    // Entonces usamos 'no-cors' y tratamos respuesta como opaca.
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body
    });

    // Aunque Apps Script devuelva ok:true,
    // el navegador lo verá como "opaque" y no podemos leerlo.
    // Entonces, asumimos éxito siempre que no haya throw.
    
    setTimeout(async () => {
      showLoader("Leyendo datos nuevos…");
      await fetchSignals();

      loaderText.textContent = "✔ Datos actualizados";
      setTimeout(() => hideLoader(), 800);
    }, 5000);

  } catch (err) {
    console.error("Error al actualizar:", err);
    loaderText.textContent = "Error al actualizar";
    setTimeout(() => hideLoader(), 1500);
  }
}

refreshBtn.addEventListener("click", () => {
  triggerUpdate();
});

// Auto-refresh cada 15 minutos (como definimos)
setInterval(() => {
  fetchSignals();
}, 15 * 60 * 1000);

// Primer carga
fetchSignals();

// Registrar service worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(err => {
      console.error("SW error:", err);
    });
  });
}
