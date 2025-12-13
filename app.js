const API_URL = "https://script.google.com/macros/s/AKfycbzbUCYFTXd0Wf0ziJXaLP0zNGU8mrWrwxS3Cc98eh6O6Vr2DrtJby5F28vPEqQg_MKG/exec";
const refreshBtn = document.getElementById("refresh-btn");

// 🟢 Ejecuta la función updateCrypto() del Apps Script
async function actualizarSheet() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Actualizando...";

    const response = await fetch(`${API_URL}?action=update`, {
      method: "GET", // Google Apps Script acepta mejor GET en modo público
      mode: "no-cors" // evita el bloqueo CORS en GitHub Pages
    });

    console.log("Respuesta del Script:", response);
    await fetchSignals();

  } catch (err) {
    console.error("Error al actualizar:", err);
    alert("Error al actualizar el Sheet");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "ACTUALIZAR AHORA";
  }
}

// 🟡 Carga los datos del Sheet
async function fetchSignals() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    console.log("Datos recibidos:", data);
    // acá luego re-renderizaremos
  } catch (e) {
    console.warn("No se pudieron obtener datos:", e);
  }
}

// 🟠 Evento de botón
refreshBtn.addEventListener("click", actualizarSheet);
