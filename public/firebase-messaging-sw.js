importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "api-center-473809",
  appId: "1:127895866129:web:058a2e937dccd2ab089ab0",
  apiKey: "AIzaSyDRV1gFrzxkfbCixxSQ6aGJ0bE2_-HqBPU",
  authDomain: "api-center-473809.firebaseapp.com",
  storageBucket: "api-center-473809.firebasestorage.app",
  messagingSenderId: "127895866129"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/apple-touch-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


