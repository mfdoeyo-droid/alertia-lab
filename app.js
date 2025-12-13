const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

const ventasContainer = document.getElementById("ventas-container");
const comprasContainer = document.getElementById("compras-container");
const ventasCountEl = document.getElementById("ventas-count");
const comprasCountEl = document.getElementById("compras-count");
const lastUpdatedEl = document.getElementById("last-updated");
const refreshBtn = document.getElementById("refresh-btn");

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

    renderList(ventasContainer, ventas, "VENTA");
    renderList(comprasContainer, compras, "COMPRA");

    ventasCountEl.textContent = `🔻 Ventas: ${ventas.length}`;
    comprasCountEl.textContent = `🔺 Compras: ${compras.length}`;

    const now = new Date();
    lastUpdatedEl.textContent =
      "Última actualización: " +
      now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  } catch (err) {
    console.error("Error al actualizar:", err);
    lastUpdatedEl.textContent = "Error al actualizar";
  }
}

function renderList(container, list, tipo) {
  container.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Sin señales activas.";
    container.appendChild(empty);
    return;
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${item.symbol}</strong><br>
      ${tipo}<br>
      Actual: ${item.price}<br>
      Objetivo ${tipo === "VENTA" ? "Venta" : "Compra"}: ${
        tipo === "VENTA" ? item.targetSell : item.targetBuy
      }
      <hr>
    `;
    container.appendChild(div);
  });
}

/* 🔘 BOTÓN */
refreshBtn.addEventListener("click", fetchSignals);

/* ▶️ Primera carga */
fetchSignals();
