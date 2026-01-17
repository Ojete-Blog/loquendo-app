"use strict";

const CACHE = "loquendo-studio-v1";
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
    await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if(event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);

  // GitHub Pages: misma origin
  if(url.origin !== location.origin) return;

  const isHTML = req.headers.get("accept")?.includes("text/html");

  // HTML: network-first para no quedarte con versiones viejas
  if(isHTML){
    event.respondWith((async () => {
      try{
        const fresh = await fetch(req, { cache: "no-store" });
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  // Assets: cache-first con fallback a red
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone());
      return fresh;
    } catch {
      return cached || new Response("", { status: 504 });
    }
  })());
});
