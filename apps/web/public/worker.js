const DEFAULT_URL = "/notifications";
const ICON = "/images/logo-icon.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    ])
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "MoonCellar", {
      body: data.body || "",
      icon: ICON,
      badge: ICON,
      tag: data.tag,
      data: { url: data.url || DEFAULT_URL },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = new URL(
    (event.notification.data && event.notification.data.url) || DEFAULT_URL,
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const opened = windows.find((client) => client.url === url);

        return opened ? opened.focus() : self.clients.openWindow(url);
      })
  );
});
