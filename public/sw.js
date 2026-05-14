// ─────────────────────────────────────────────────────────
//  CinéRadar — Service Worker
//  Stratégie : Cache First pour les assets statiques,
//              Network First pour les pages et l'API.
// ─────────────────────────────────────────────────────────

// Incrémenter ce numéro à chaque déploiement pour invalider le cache
const CACHE_NAME = "cineradar-v3";

// Assets à mettre en cache immédiatement à l'installation
const STATIC_ASSETS = [
  "/",
  "/films",
  "/films/classiques",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Installation ──────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On n'échoue pas si un asset est inaccessible
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// ── Activation ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-GET et les extensions de navigateur
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API backend → Network First (données fraîches en priorité)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets Next.js → Network First
  // NOTE: on n'utilise PAS Cache First ici car en dev les noms de chunks
  // ne sont pas content-addressés. En prod, les navigateurs gèrent eux-mêmes
  // le cache via Cache-Control (immutable) sur les fichiers hachés.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Pages HTML → Network First avec fallback cache
  event.respondWith(networkFirst(request));
});

// ── Stratégies ────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback offline minimal
    return new Response(
      `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
      <title>CinéRadar — Hors ligne</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0f0f;color:#fff}
      .box{text-align:center;padding:2rem}.icon{font-size:3rem;margin-bottom:1rem}h1{color:#e63946}p{color:#aaa}</style>
      </head><body><div class="box">
      <div class="icon">📡</div>
      <h1>Vous êtes hors ligne</h1>
      <p>CinéRadar nécessite une connexion pour afficher les séances.</p>
      <p style="margin-top:1rem"><a href="/" style="color:#e63946">Réessayer →</a></p>
      </div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
