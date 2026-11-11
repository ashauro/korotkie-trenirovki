// Service worker: keeps the whole app on the device so it opens without a network.
// Change VERSION on every release (keep it equal to APP_VERSION in app.js): that is what makes phones pick up the new files.
const VERSION = "1.0.0";
const CACHE = "kt-" + VERSION;
const SHELL = [
  "./", "index.html", "styles.css", "theme.js", "app.js", "manifest.webmanifest",
  "icons/favicon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  "fonts/onest-cyrillic.woff2", "fonts/onest-latin.woff2", "fonts/sofia-sans-condensed-cyrillic.woff2", "fonts/sofia-sans-condensed-latin.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("kt-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page asks for this when the user taps «Обновить».
self.addEventListener("message", e => { if(e.data === "skip-waiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;
  if(req.mode === "navigate"){
    e.respondWith(caches.match("index.html", {cacheName: CACHE}).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, {cacheName: CACHE, ignoreSearch: true}).then(hit => hit || fetch(req)));
});
