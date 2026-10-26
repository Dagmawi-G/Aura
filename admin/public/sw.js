// Service Worker for Aura Admin Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Aura Admin Notification", body: event.data.text() };
    }
  }

  const isUrgent = data.data?.isUrgent || data.title?.toLowerCase().includes("urgent");
  const title = data.title || (isUrgent ? "New Urgent Order" : "New Order");
  const body = data.body || "A new customer order has arrived on Aura Collection.";

  const options = {
    body: body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: isUrgent ? [300, 100, 300, 100, 400] : [200, 100, 200],
    tag: data.data?.orderNumber || "aura-order-notif",
    renotify: true,
    requireInteraction: isUrgent, // Keep on screen on phone until dismissed if urgent
    data: data.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const orderUrl = event.notification.data?.url || "/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, navigate & focus it
      for (const client of windowClients) {
        if ("focus" in client) {
          if ("navigate" in client && orderUrl) {
            client.navigate(orderUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(orderUrl);
      }
    })
  );
});
