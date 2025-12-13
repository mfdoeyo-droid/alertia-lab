// alertia-notify.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyAuhBYWhita8nVqGrHnmVg7sddMF6sPb5Y",
    authDomain: "alertia1410.firebaseapp.com",
    projectId: "alertia1410",
    storageBucket: "alertia1410.firebasestorage.app",
    messagingSenderId: "70229861002",
    appId: "1:70229861002:web:bd948208b06d47d9f68373"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Registrar service worker
navigator.serviceWorker.register("/firebase-messaging-sw.js")
.then(async (registration) => {

    console.log("Service Worker registrado!");

    const token = await getToken(messaging, {
        vapidKey: "BBo3-UsEwMA9CKuZJaeeRRm4WFjnUlXnrLd3rkUt6Wa8pmFRdUo3FQe9WIxSKzX2AKv4zlr24JmyUnVvhhQYzIA",
        serviceWorkerRegistration: registration
    });

    console.log("Token FCM:", token);

    // Enviar token a tu Apps Script
    await fetch("TU_URL_DE_APPS_SCRIPT_AQUÍ", {
        method: "POST",
        body: JSON.stringify({
            action: "saveToken",
            token
        })
    });

});
