"use strict";

const CACHE = "loquendo-studio-v3";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      self.clients.claim();
    })());
  }
});

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: "no-store" });
    c.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response("", { status: 504 });
  }
}

async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE);
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then((fresh) => {
    c.put(req, fresh.clone());
    return fresh;
  }).catch(() => null);
  return cached || fetchPromise || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const path = url.pathname;

  const isHTML = req.headers.get("accept")?.includes("text/html");
  const isCoreAsset =
    path.endsWith("/app.js") ||
    path.endsWith("/styles.css") ||
    path.endsWith("/manifest.webmanifest");

  if (isHTML || isCoreAsset) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});
