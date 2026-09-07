const CACHE_NAME = "run-apparel-v1";
const CATALOG_CACHE_NAME = "run-catalog-v1";
const CURRENT_CACHES = [CACHE_NAME, CATALOG_CACHE_NAME];

const STATIC_ASSETS = [
  "/offline.html",
  "/fonts/NeueStance-Bold.woff2",
  "/logo.webp",
  "/favicon.ico",
];

// Install: Precache offline fallback and core fonts
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate: Clean up old cache versions (preserving current app & catalog caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: SWR for catalog API; Network first with offline fallback for navigation; Cache first for static fonts/images
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Partitioned Offline Catalog Caching (Stale-While-Revalidate)
  if (
    request.method === "GET" &&
    (url.pathname.startsWith("/api/products") || url.pathname.startsWith("/api/categories"))
  ) {
    event.respondWith(
      caches.open(CATALOG_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            if (cachedResponse) {
              const headers = new Headers(cachedResponse.headers);
              headers.set("X-Cache", "HIT-OFFLINE");
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers,
              });
            }
            throw error;
          });

        if (cachedResponse) {
          // If offline and network unavailable, return cached response with HIT-OFFLINE header
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-Cache", "HIT-OFFLINE");
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers,
            });
          }

          // Return cached JSON immediately, revalidate in background
          fetchPromise.catch(() => {});
          return cachedResponse;
        }

        return fetchPromise;
      }),
    );
    return;
  }

  // Skip non-GET requests and non-catalog API/mutation endpoints
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Static fonts and images: Cache-first strategy
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // HTML navigation: Network-first with offline.html fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/offline.html");
      }),
    );
  }
});
