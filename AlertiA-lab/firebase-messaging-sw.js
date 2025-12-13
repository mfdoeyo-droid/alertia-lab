// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Tu configuración Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAuhBYWhita8nVqGrHnmVg7sddMF6sPb5Y",
    authDomain: "alertia1410.firebaseapp.com",
    projectId: "alertia1410",
    storageBucket: "alertia1410.firebasestorage.app",
    messagingSenderId: "70229861002",
    appId: "1:70229861002:web:bd948208b06d47d9f68373"
});

// Inicializar messaging
const messaging = firebase.messaging();

// Manejo de notificaciones cuando la app esté cerrada
messaging.onBackgroundMessage((payload) => {
    console.log("[AlertIA] Notificación recibida en segundo plano:", payload);

    const notificationTitle = payload.notification.title || "AlertIA";
    const notificationOptions = {
        body: payload.notification.body || "",
        icon: "/icon.png"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
