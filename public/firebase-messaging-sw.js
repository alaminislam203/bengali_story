importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// These values are public and safe to include here.
firebase.initializeApp({
  messagingSenderId: "182725804734",
  apiKey: "AIzaSyDFftX5AK4-iZaBs8mrEse01DnjYl0YKXI",
  projectId: "qalbetalks-com-1766047604658",
  appId: "1:182725804734:web:eeeb4599a2b541737d14ef",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
