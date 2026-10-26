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

  let rawUrl = event.notification.data?.url || "/#/orders";

  // Ensure the URL always uses HashRouter format '/#/orders/...'
  let targetPath = rawUrl;
  if (!targetPath.startsWith("http")) {
    if (targetPath.startsWith("/#")) {
      // already has /#
    } else if (targetPath.startsWith("#")) {
      targetPath = "/" + targetPath;
    } else {
      // e.g. /orders/123 -> /#/orders/123
      targetPath = "/#" + (targetPath.startsWith("/") ? targetPath : "/" + targetPath);
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, navigate & focus it
      for (const client of windowClients) {
        if ("focus" in client) {
          const clientOrigin = client.url ? new URL(client.url).origin : self.location.origin;
          const fullUrl = targetPath.startsWith("http") ? targetPath : `${clientOrigin}${targetPath}`;
          if ("navigate" in client) {
            client.navigate(fullUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        const fullUrl = targetPath.startsWith("http") ? targetPath : `${self.location.origin}${targetPath}`;
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
