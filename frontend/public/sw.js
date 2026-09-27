// Service worker: notifications (unchanged) + opportunistic offline caching
// of the app shell and exercise images, so the app still opens — and shows
// exercises already seen before — with no connection at all.
const STATIC_CACHE = "gymstrack-static-v1";
const IMAGE_CACHE = "gymstrack-images-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("/");
      }
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never intercept writes

  const url = new URL(request.url);

  // API calls always go straight to the network — offline support for
  // those lives in the app's own IndexedDB sync queue (lib/offlineDb.ts),
  // never in a blanket cache here, so responses stay authoritative.
  if (url.pathname.startsWith("/api/")) return;

  // Exercise images: cache-first, forever (they never change once
  // published). Works the same for our own origin and for the external
  // exercise-image host — a cross-origin "opaque" response can still be
  // cached and replayed, it just can't be inspected from JS.
  if (request.destination === "image") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          return cached || Promise.reject(err);
        }
      }),
    );
    return;
  }

  // App shell (HTML/JS/CSS/fonts): stale-while-revalidate — serve the
  // cached copy instantly if there is one, refresh it in the background,
  // and fall back to the cache entirely when there's no network at all.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});
