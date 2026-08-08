const CACHE_NAME = "audhd-tools-shell-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./tests/",
  "./tests/questionnaire.html",
  "./tests/resultats.html",
  "./fiches/",
  "./fiches/module.html",
  "./documents/",
  "./reglages/",
  "./confidentialite/",
  "./securite/",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/styles.css",
  "./assets/main.js",
  "./assets/pdf.js",
  "./assets/portable.js",
  "./assets/scoring.js",
  "./assets/store.js",
  "./assets/vendor/jspdf.umd.min.js",
  "./site-data/tests.json",
  "./site-data/waves.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || caches.match("./index.html")))
  );
});
