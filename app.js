const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";

const refreshBtn = document.getElementById("refresh-btn");

async function actualizarSheet() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";

    // 🔥 POST que ejecuta updateCrypto()
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update" })
    });

    // 🔄 volver a pedir los datos
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
  // ⚠️ acá NO tocamos render todavía
}

refreshBtn.addEventListener("click", actualizarSheet);
