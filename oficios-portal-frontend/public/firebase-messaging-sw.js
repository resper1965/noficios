/* Firebase Messaging Service Worker */
/* Compat imports to keep SW simple */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the messagingSenderId.
firebase.initializeApp({
  messagingSenderId: '491078993287',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  const notification = payload.notification || {};
  const title = notification.title || 'n.Oficios';
  const options = {
    body: notification.body || 'Nova atualização',
    icon: notification.icon || '/icon.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

// Focus/open a relevant client when notification is clicked
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});





