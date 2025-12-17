// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "TU_API_KEY",
  authDomain: "alertia1410.firebaseapp.com",
  projectId: "alertia1410",
  storageBucket: "alertia1410.appspot.com",
  messagingSenderId: "70229861002",
  appId: "1:70229861002:web:bd948208b06d47d9f68373"
});

const messaging = firebase.messaging();

// 🔔 Push cuando la app está cerrada
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || "AlertIA";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192.png"
  };

  self.registration.showNotification(title, options);
});

