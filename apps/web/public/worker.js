const DEFAULT_URL = "/notifications";
const ICON = "/images/logo-icon.png";
const OFFLINE_CACHE = "offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, ICON]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      self.registration.navigationPreload &&
        self.registration.navigationPreload.enable(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== OFFLINE_CACHE)
              .map((key) => caches.delete(key))
          )
        ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    Promise.resolve(event.preloadResponse)
      .then((preloaded) => preloaded || fetch(event.request))
      .catch(() =>
        caches
          .open(OFFLINE_CACHE)
          .then((cache) => cache.match(OFFLINE_URL))
          .then((response) => response || Response.error())
      )
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
