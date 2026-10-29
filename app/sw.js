// Service worker : cache hors-ligne + affichage des notifications push.
const CACHE = "palm-v6";
const ASSETS = [
  "./", "./index.html", "./admin.html", "./css/style.css", "./css/home.css", "./css/admin.css",
  "./js/data.js", "./js/api.js", "./js/app.js", "./js/admin.js",
  "./icons/logo.png", "./icons/favicon.png", "./icons/icon-192.png", "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Réseau d'abord, cache en secours — jamais pour l'API (données toujours fraîches).
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Notification envoyée par le serveur (même si l'app est fermée).
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(data.title || "Palm Beauty Centre", {
      body: data.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/favicon.png",
      tag: data.tag,
      renotify: !!data.tag,
      vibrate: [120, 60, 120],
      data: { url: data.url || "index.html" }
    });
    // Si l'app est ouverte, elle affiche un bandeau et rafraîchit la liste.
    const wins = await self.clients.matchAll({ type: "window" });
    wins.forEach((w) => w.postMessage({ type: "push", payload: data }));
  })());
});

// Clic sur la notification : ouvrir (ou ramener) l'app sur la bonne page.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "index.html", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const page = target.split("#")[0];
      const win = wins.find((w) => w.url.split("#")[0] === page);
      if (win) return win.navigate(target).then((w) => (w || win).focus());
      return self.clients.openWindow(target);
    })
  );
});
