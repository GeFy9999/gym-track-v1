// Service worker: notifications (unchanged) + opportunistic offline caching
// of the app shell and exercise images, so the app still opens — and shows
// exercises already seen before — with no connection at all.
// Bumped whenever the caching strategy changes, so old entries get purged.
const STATIC_CACHE = "gymstrack-static-v2";
const IMAGE_CACHE = "gymstrack-images-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("gymstrack-static-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
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

  if (url.origin !== self.location.origin) return;

  // Pages (index.html): network first, so a new deploy shows up on the very
  // next load — serving the cached shell first meant every deploy only
  // appeared one reload late. The cached copy is only the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          // Offline: any cached page works — it's the same SPA shell.
          return (
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            (await cache.match("/index.html")) ||
            Response.error()
          );
        }
      }),
    );
    return;
  }

  // Everything else from our origin (hashed JS/CSS in /assets/, fonts,
  // icons, manifest): stale-while-revalidate — /assets/ files get a new
  // name on every build, so a cached one is never stale.
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        // Never resolve to undefined here — respondWith() requires an
        // actual Response, or the browser throws "Failed to convert value
        // to 'Response'" and the request just dies.
        .catch(() => cached || Response.error());
      return cached || networkFetch;
    }),
  );
});
