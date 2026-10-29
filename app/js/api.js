// Accès au serveur Palm (API Node.js + PostgreSQL) et aux notifications
// Web Push, partagé entre l'espace client (app.js) et l'espace admin (admin.js).

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Texte bilingue {fr, ar} -> chaîne dans la langue demandée (repli sur le français).
const tr = (obj, lang) => (obj ? obj[lang] || obj.fr || "" : "");

const Api = (() => {
  const TOKEN_KEY = "palm.token";
  // L'app doit être ouverte via le serveur (http://localhost:3000 ou le site en ligne).
  const configured = location.protocol.startsWith("http");

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }
  };

  let currentUser = null;
  const authListeners = [];
  const setSession = (token, user) => {
    store.set(TOKEN_KEY, token);
    currentUser = user;
    authListeners.forEach((cb) => cb(user));
  };

  async function request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    const token = store.get(TOKEN_KEY);
    if (token) headers.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch("/api" + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new Error("Failed to fetch");
    }
    if (res.status === 401 && token && !path.startsWith("/auth/login")) setSession(null, null);
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
    return data;
  }

  const normalizePhone = (p) => String(p || "").replace(/\D/g, "").replace(/^216(?=\d{8}$)/, "");

  function friendlyError(err) {
    const m = (err && err.message) || String(err || "");
    if (/invalid login credentials/i.test(m)) return { fr: "Téléphone ou mot de passe incorrect.", ar: "رقم الهاتف أو كلمة السر غالطين." };
    if (/already registered/i.test(m)) return { fr: "Ce numéro a déjà un compte. Connectez-vous.", ar: "الرقم هذا عندو حساب. ادخلي بيه." };
    if (/6 caractères/i.test(m)) return { fr: "Mot de passe : 6 caractères minimum.", ar: "كلمة السر: 6 حروف على الأقل." };
    if (/trop d'essais/i.test(m)) return { fr: m, ar: "برشا محاولات، عاودي بعد شوية." };
    if (/failed to fetch/i.test(m)) return { fr: "Pas de connexion au serveur.", ar: "ما فماش اتصال بالسيرفر." };
    return { fr: m || "Erreur inconnue", ar: m || "خطأ" };
  }

  // Clé publique Web Push fournie par le serveur (null si non configurée).
  let pushKey;
  async function serverPushKey() {
    if (pushKey === undefined) pushKey = configured ? (await request("GET", "/push/key").catch(() => null))?.key ?? null : null;
    return pushKey;
  }

  const urlB64ToUint8 = (b64) => {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  };

  const currentSubscription = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? reg.pushManager.getSubscription() : null;
  };

  return {
    configured,
    normalizePhone,
    friendlyError,

    // ---------- Comptes (téléphone + mot de passe) ----------
    async user() {
      if (!store.get(TOKEN_KEY)) return null;
      if (!currentUser) currentUser = await request("GET", "/auth/me").catch(() => null);
      return currentUser;
    },
    async profile() {
      return this.user();
    },
    async signUp({ fullName, phone, password }) {
      const { token, user } = await request("POST", "/auth/signup", { fullName, phone, password });
      setSession(token, user);
      return user;
    },
    async signIn({ phone, password }) {
      const { token, user } = await request("POST", "/auth/login", { phone, password });
      setSession(token, user);
      return user;
    },
    async signOut() {
      await this.disablePush().catch(() => {});
      setSession(null, null);
    },
    onAuthChange(cb) {
      authListeners.push(cb);
    },

    // ---------- Catalogue ----------
    async catalog() {
      try {
        return await request("GET", "/catalog");
      } catch {
        return JSON.parse(JSON.stringify(window.PALM_DEFAULT));
      }
    },
    saveCatalog(catalog) {
      return request("PUT", "/catalog", catalog);
    },
    // Photo envoyée telle quelle (JPEG/PNG/WebP) ; renvoie son adresse /api/images/…
    async uploadImage(blob) {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": blob.type, Authorization: "Bearer " + store.get(TOKEN_KEY) },
        body: blob
      }).catch(() => { throw new Error("Failed to fetch"); });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
      return data.url;
    },
    // Seules les photos envoyées depuis l'admin sont supprimées (pas celles fournies avec l'app).
    deleteImage(url) {
      if (!/^\/api\/images\/[\w-]+$/.test(url || "")) return Promise.resolve();
      return request("DELETE", url.slice(4)).catch(() => {});
    },

    // ---------- Réservations ----------
    myBookings() {
      return store.get(TOKEN_KEY) ? request("GET", "/bookings") : Promise.resolve([]);
    },
    allBookings() {
      return request("GET", "/bookings");
    },
    // booking : { name, phone, date, time, note, serviceIds, lang, status? }
    createBooking(booking) {
      return request("POST", "/bookings", booking);
    },
    setStatus(id, status) {
      return request("PATCH", "/bookings/" + encodeURIComponent(id), { status });
    },
    // Admin : modification complète (même champs que createBooking).
    updateBooking(id, booking) {
      return request("PUT", "/bookings/" + encodeURIComponent(id), booking);
    },
    deleteBooking(id) {
      return request("DELETE", "/bookings/" + encodeURIComponent(id));
    },
    // Rafraîchit l'écran dès qu'une réservation change (flux temps réel du serveur).
    watchBookings(cb) {
      let source = null;
      const connect = () => {
        source?.close();
        const token = store.get(TOKEN_KEY);
        if (!token || !configured) return;
        source = new EventSource("/api/events?token=" + encodeURIComponent(token));
        source.addEventListener("booking", cb);
      };
      connect();
      authListeners.push(connect);
    },

    // ---------- Comptes (admin) ----------
    users() {
      return request("GET", "/users");
    },
    createUser(user) {
      return request("POST", "/users", user);
    },
    updateUser(id, changes) {
      return request("PATCH", "/users/" + encodeURIComponent(id), changes);
    },
    deleteUser(id) {
      return request("DELETE", "/users/" + encodeURIComponent(id));
    },
    changePassword(currentPassword, newPassword) {
      return request("POST", "/auth/password", { currentPassword, newPassword });
    },

    // ---------- Notifications push (Web Push direct) ----------
    pushSupported() {
      return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    },
    // iPhone : les notifications ne marchent que si l'app est ajoutée à l'écran d'accueil.
    needsInstallForPush() {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      return ios && !standalone;
    },
    async pushState() {
      if (!this.pushSupported()) return this.needsInstallForPush() ? "install" : "unsupported";
      if (!(await serverPushKey())) return "unconfigured";
      if (Notification.permission === "denied") return "denied";
      return Notification.permission === "granted" && (await currentSubscription()) ? "on" : "off";
    },
    async enablePush() {
      const key = await serverPushKey();
      if (!key) throw new Error("unconfigured");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("permission");
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      // Sans réponse du service push du téléphone (réseau, mode privé…), on abandonne au lieu d'attendre indéfiniment.
      if (!sub) sub = await Promise.race([
        reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(key) }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000))
      ]);
      await request("POST", "/push", { subscription: sub.toJSON() });
    },
    async disablePush() {
      const sub = await currentSubscription();
      if (!sub) return;
      await request("DELETE", "/push", { endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe();
    },
    // Notification reçue pendant que l'app est ouverte : le service worker la signale à la page.
    onForegroundMessage(cb) {
      navigator.serviceWorker?.addEventListener("message", (e) => {
        if (e.data?.type === "push") cb(e.data.payload || {});
      });
    },
    registerServiceWorker() {
      if ("serviceWorker" in navigator && configured) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
      }
    }
  };
})();
