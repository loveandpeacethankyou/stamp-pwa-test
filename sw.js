const CACHE = "stamp-pwa-test-v3";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Diagnostic/other pages must go straight to network.
  // This prevents photo-picker-test.html from being replaced by cached index.html.
  const scopePath = new URL(self.registration.scope).pathname;
  const relPath = url.pathname.slice(scopePath.length);

  if (relPath && relPath !== "index.html" &&
      !relPath.startsWith("manifest.json") &&
      !relPath.startsWith("icon-")) {
    return;
  }

  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("./index.html"));
    })
  );
});
