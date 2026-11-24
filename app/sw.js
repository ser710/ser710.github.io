/* Aerion web app: the service worker (scripts/web-build.js fills in the tag and copies it beside the pages).
   - The app pages (index.html, commercial.html): the network first, so a page opened online is always the newest
     version, and the copy kept here is refreshed; with no connection (or after 6 s with no answer) the kept copy opens.
   - The manifests and icons: kept at install.
   - The fonts and the PDF reader's helper from their own servers: the kept copy at once, refreshed in the background.
   - Everything else (the license server, the AI service, price feeds, maps): straight to the network, never kept.
   A new web copy has a new tag, so the browser installs this worker again and the old copy is thrown away. */
"use strict";
const TAG = "1.5.67-5e700f91df",
  CACHE = "aerion-web-" + TAG,
  RT = "aerion-web-rt";
const CORE = ["manifest.webmanifest", "commercial.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png", "icons/icon-commercial-192.png", "icons/icon-commercial-512.png", "icons/icon-commercial-180.png"];
const PAGES = ["index.html", "commercial.html"];
const RUNTIME_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

const scopeUrl = (p) => new URL(p, self.registration.scope).href;
/* the residential page answers at both /app/ and /app/index.html: keep it under one name */
function pageKey(url) {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  if (u.href === self.registration.scope) return scopeUrl("index.html");
  return u.href;
}
const isPage = (url) => {
  const k = pageKey(url);
  return PAGES.some((p) => scopeUrl(p) === k);
};

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE.map(scopeUrl)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      /* carry the pages already kept by the old copy over, so the app still opens offline until it is next online */
      const names = await caches.keys();
      const cur = await caches.open(CACHE);
      for (const n of names) {
        if (n === CACHE || n === RT || !n.startsWith("aerion-web-")) continue;
        const old = await caches.open(n);
        for (const p of PAGES) {
          const k = scopeUrl(p);
          if (!(await cur.match(k))) {
            const r = await old.match(k);
            if (r) await cur.put(k, r);
          }
        }
        await caches.delete(n);
      }
      await self.clients.claim();
    })()
  );
});

/* the page asks for itself to be kept (the first visit, before this worker was in charge) */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "keep" && d.url && isPage(d.url)) e.waitUntil(refresh(pageKey(d.url)).catch(() => {}));
});

async function refresh(key) {
  const r = await fetch(key, { cache: "no-cache" });
  if (r && r.ok) {
    const c = await caches.open(CACHE);
    await c.put(key, r.clone());
  }
  return r;
}

async function page(req) {
  const key = pageKey(req.url);
  const net = refresh(key);
  const timeout = new Promise((res) => setTimeout(res, 6000, null));
  try {
    const r = await Promise.race([net, timeout]);
    if (r && r.ok) return r;
  } catch (e) {}
  const kept = await caches.match(key, { cacheName: CACHE });
  if (kept) return kept;
  try {
    return await net;
  } catch (e) {
    return new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><body style='font:16px system-ui;background:#0a0a0b;color:#f5f5f7;padding:24px'><h1>Aerion</h1><p>Aerion needs a connection the first time it opens on this device. Connect to the internet and try again.</p>", { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
  }
}

async function runtime(req) {
  const c = await caches.open(RT);
  const kept = await c.match(req);
  const net = fetch(req)
    .then((r) => {
      if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone());
      return r;
    })
    .catch(() => null);
  return kept || (await net) || Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (req.mode === "navigate" || isPage(req.url)) {
      if (isPage(req.url)) e.respondWith(page(req));
      return;
    }
    if (u.href.startsWith(self.registration.scope)) e.respondWith(caches.match(req, { cacheName: CACHE }).then((r) => r || fetch(req)));
    return;
  }
  if (RUNTIME_HOSTS.includes(u.hostname)) e.respondWith(runtime(req));
});
