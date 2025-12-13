const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

const refreshBtn = document.getElementById("refresh-btn");

async function actualizarSheet() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";

    // 1️⃣ POST vacío → dispara doPost()
    await fetch(API_URL + "?action=update", {
      method: "POST",
      mode: "no-cors"
    });

    // 2️⃣ pequeña espera para que el Sheet escriba
    await new Promise(r => setTimeout(r, 1500));

    // 3️⃣ GET → trae los datos nuevos
    await fetchSignals();

  } catch (err) {
    console.error("Error al actualizar:", err);
    alert("Error al actualizar el Sheet");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "ACTUALIZAR AHORA";
  }
}

async function fetchSignals() {
  const res = await fetch(API_URL);
  const data = await res.json();

  console.log("Datos recibidos:", data);

  const ventas = data.filter(x => x.signal === "VENTA");
  const compras = data.filter(x => x.signal === "COMPRA");

  document.getElementById("ventas-count").textContent = `Ventas: ${ventas.length}`;
  document.getElementById("compras-count").textContent = `Compras: ${compras.length}`;

  const ventasBox = document.getElementById("ventas-container");
  const comprasBox = document.getElementById("compras-container");

  ventasBox.innerHTML = "";
  comprasBox.innerHTML = "";

  ventas.forEach(v => {
    ventasBox.innerHTML += `
      <div class="card">
        <b>${v.symbol}</b> | ${v.price}
      </div>
    `;
  });

  compras.forEach(c => {
    comprasBox.innerHTML += `
      <div class="card">
        <b>${c.symbol}</b> | ${c.price}
      </div>
    `;
  });
}
refreshBtn.addEventListener("click", actualizarSheet);
