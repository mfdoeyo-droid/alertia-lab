// alertia-notify.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";

// 🔥 Firebase config (LA MISMA QUE YA USÁS)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "alertia1410.firebaseapp.com",
  projectId: "alertia1410",
  storageBucket: "alertia1410.appspot.com",
  messagingSenderId: "70229861002",
  appId: "1:70229861002:web:bd948208b06d47d9f68373"
};

// 🚀 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 🔑 VAPID KEY (la que me pasaste)
const VAPID_KEY =
  "BKN6IqEsTGij4p09Y0O7NCWQvau76FSd_IWgaPBm_QjHYCG5L6iKaXjMbelPLCUQzAI0_whJBwWhU0Lez_MTfYE";

// 🧠 Registrar Service Worker + pedir token
async function initNotifications() {
  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    console.log("✅ Token FCM:", token);
    // 👉 más adelante este token se guarda (Sheet / backend)
  } catch (err) {
    console.error("❌ Error notificaciones:", err);
  }
}

initNotifications();

// 🟢 Mensajes con la app ABIERTA
onMessage(messaging, payload => {
  console.log("🔔 Notificación foreground:", payload);
});
