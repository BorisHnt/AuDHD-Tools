const CACHE_NAME = "audhd-tools-shell-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./fr/", "./fr/tests/", "./fr/tests/questionnaire.html", "./fr/tests/resultats.html",
  "./fr/fiches/", "./fr/fiches/module.html", "./fr/documents/", "./fr/reglages/", "./fr/confidentialite/", "./fr/securite/",
  "./en/", "./en/tests/", "./en/tests/questionnaire.html", "./en/tests/resultats.html",
  "./en/fiches/", "./en/fiches/module.html", "./en/documents/", "./en/reglages/", "./en/confidentialite/", "./en/securite/",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/styles.css",
  "./assets/main.js",
  "./assets/i18n.js",
  "./assets/pdf.js",
  "./assets/result-guidance.js",
  "./assets/portable.js",
  "./assets/scoring.js",
  "./assets/store.js",
  "./assets/vendor/jspdf.umd.min.js",
  "./assets/fonts/LiberationSans-Regular.ttf",
  "./assets/fonts/LiberationSans-Bold.ttf",
  "./site-data/tests.json",
  "./site-data/waves.json",
  "./site-data/en/tests.json",
  "./site-data/en/waves.json",
  "./site-data/en/ui.json"
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
