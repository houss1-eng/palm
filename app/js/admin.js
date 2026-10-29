const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let catalog = JSON.parse(JSON.stringify(window.PALM_DEFAULT));
let bookings = [];
let editingId = null;

const money = (v) => (v == null ? "sur demande" : `${v} DT`);
const fmtDate = (d) => new Date(d + "T00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const errText = (e) => Api.friendlyError(e).fr;

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}

async function saveCatalog(msg = "Enregistré") {
  try {
    await Api.saveCatalog(catalog);
    toast(msg);
    return true;
  } catch (e) {
    toast("Erreur : " + errText(e));
    return false;
  }
}

// ---------- Connexion (compte avec le rôle admin) ----------
async function enter(user) {
  if (!user) return showLogin();
  const profile = await Api.profile().catch(() => null);
  if (profile?.role !== "admin") {
    await Api.signOut();
    return showLogin("Ce compte n'a pas l'accès admin.");
  }
  me = profile;
  $("#login").hidden = true;
  $("#app").hidden = false;
  [catalog, bookings] = await Promise.all([Api.catalog(), Api.allBookings()]);
  renderBookings();
  renderServices();
  renderCategories();
  renderSite();
  loadUsers();
  fillSettings();
  renderPushBtn();
}

function showLogin(msg = "") {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#loginError").textContent = msg;
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector("button");
  btn.disabled = true;
  try {
    const user = await Api.signIn({ phone: f.phone.value, password: f.password.value });
    await enter(user);
  } catch (err) {
    $("#loginError").textContent = errText(err);
  } finally {
    btn.disabled = false;
  }
});

$("#logout").addEventListener("click", async () => {
  await Api.signOut();
  location.reload();
});

// ---------- Notifications sur le téléphone du centre ----------
async function renderPushBtn() {
  const st = await Api.pushState();
  const btn = $("#pushBtn");
  btn.hidden = st === "on" || st === "unsupported" || st === "unconfigured";
  btn.textContent = st === "install" ? "🔔 Comment activer ?" : st === "denied" ? "🔕 Bloquées" : "🔔 Activer";
  btn.dataset.state = st;
}

$("#pushBtn").addEventListener("click", async (e) => {
  const st = e.currentTarget.dataset.state;
  if (st === "install") return alert("Sur iPhone : Partager ⬆️ → « Sur l'écran d'accueil », puis ouvrez Palm Admin depuis l'icône et activez les notifications.");
  if (st === "denied") return alert("Les notifications sont bloquées pour ce site : autorisez-les dans les réglages du navigateur.");
  try {
    await Api.enablePush();
    toast("Notifications activées : vous serez prévenue à chaque nouvelle réservation 🔔");
  } catch (err) {
    toast(err.message === "permission" ? "Autorisation refusée" : "Impossible d'activer les notifications");
  }
  renderPushBtn();
});

// ---------- Onglets ----------
$$(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.toggle("on", t === tab));
    $$(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + tab.dataset.tab));
    if (tab.dataset.tab === "users") loadUsers();
  })
);

// ---------- Réservations ----------
function renderBookings() {
  const status = $("#statusFilter").value;
  const date = $("#dateFilter").value;
  const list = bookings.filter((b) => (!status || b.status === status) && (!date || b.date === date));

  const today = todayStr();
  const fresh = bookings.filter((b) => b.status === "nouveau").length;
  const revenue = bookings.filter((b) => b.status === "terminé").reduce((s, b) => s + Number(b.total || 0), 0);
  $("#stats").innerHTML = `
    <div class="stat"><b>${fresh}</b><span>Nouvelles demandes</span></div>
    <div class="stat"><b>${bookings.filter((b) => b.date === today && b.status !== "annulé").length}</b><span>Rendez-vous aujourd'hui</span></div>
    <div class="stat"><b>${bookings.filter((b) => b.date >= today && b.status === "confirmé").length}</b><span>Confirmés à venir</span></div>
    <div class="stat"><b>${revenue} DT</b><span>Chiffre (terminés)</span></div>`;
  $("#newCount").textContent = fresh;
  $("#newCount").hidden = fresh === 0;

  $("#bookingList").innerHTML = list.length
    ? list.map((b) => `
      <article class="bk">
        <div class="bk-head"><b>${esc(b.name)}</b><span class="status ${esc(b.status)}">${esc(b.status)}</span></div>
        <div class="bk-when">${esc(fmtDate(b.date))} · ${esc(b.time)}</div>
        <div class="muted" dir="ltr">📞 ${esc(b.phone)} ${b.user_id ? "· 📱 via l'app" : "· ✍️ ajout manuel"}</div>
        <ul>${(b.services.length ? b.services : [{ name: "À préciser" }])
          .map((s) => `<li>${esc(s.name)}${s.price != null ? ` — ${s.price} DT` : ""}</li>`).join("")}</ul>
        ${Number(b.total) ? `<div><b>Total : ${b.total} DT</b></div>` : ""}
        ${b.note ? `<div class="muted">📝 ${esc(b.note)}</div>` : ""}
        <div class="bk-actions">
          ${b.status !== "confirmé" ? `<button class="mini ok" data-status="confirmé" data-id="${b.id}">Confirmer</button>` : ""}
          ${b.status !== "terminé" ? `<button class="mini" data-status="terminé" data-id="${b.id}">Terminé</button>` : ""}
          ${b.status !== "annulé" ? `<button class="mini bad" data-status="annulé" data-id="${b.id}">Annuler</button>` : ""}
          <button class="mini" data-edit-booking="${b.id}">✏️ Modifier</button>
          <a class="mini" href="tel:+216${esc(b.phone)}">Appeler</a>
          <button class="mini bad" data-del-booking="${b.id}" aria-label="Supprimer">🗑</button>
        </div>
      </article>`).join("")
    : `<p class="empty">Aucune réservation.</p>`;
}

async function reloadBookings() {
  try {
    bookings = await Api.allBookings();
    renderBookings();
  } catch (e) {
    toast("Erreur : " + errText(e));
  }
}

$("#statusFilter").addEventListener("change", renderBookings);
$("#dateFilter").addEventListener("change", renderBookings);

$("#bookingList").addEventListener("click", async (e) => {
  const st = e.target.closest("[data-status]");
  const del = e.target.closest("[data-del-booking]");
  const edit = e.target.closest("[data-edit-booking]");
  if (edit) return openBookingForm(edit.dataset.editBooking);
  try {
    if (st) {
      st.disabled = true;
      await Api.setStatus(st.dataset.id, st.dataset.status);
      toast(st.dataset.status === "confirmé" ? "Confirmé — la cliente est notifiée ✅" : "Statut mis à jour");
    } else if (del) {
      if (!confirm("Supprimer définitivement cette réservation ?")) return;
      await Api.deleteBooking(del.dataset.delBooking);
    } else {
      return;
    }
  } catch (err) {
    toast("Erreur : " + errText(err));
  }
  reloadBookings();
});

let editingBookingId = null;

// Même formulaire pour ajouter (rendez-vous pris par téléphone) et modifier.
function openBookingForm(id) {
  const b = id ? bookings.find((x) => x.id === id) : null;
  editingBookingId = b?.id ?? null;
  const f = $("#bookingForm");
  f.reset();
  $("#bookingError").textContent = "";
  $("#bookingDlgTitle").textContent = b ? "Modifier la réservation" : "Nouvelle réservation";
  $("#bookingSubmit").textContent = b ? "Enregistrer" : "Ajouter";
  const selected = new Set((b?.services ?? []).map((s) => s.id));
  f.services.innerHTML = catalog.categories.map((c) => `
    <optgroup label="${esc(tr(c.name, "fr"))}">
      ${catalog.services.filter((s) => s.cat === c.id).map((s) =>
        `<option value="${esc(s.id)}"${selected.has(s.id) ? " selected" : ""}>${esc(s.name.fr)} — ${esc(money(s.price))}</option>`).join("")}
    </optgroup>`).join("");
  f.name.value = b?.name ?? "";
  f.phone.value = b?.phone ?? "";
  f.date.value = b?.date ?? todayStr();
  f.time.value = b?.time ?? "";
  f.note.value = b?.note ?? "";
  f.status.value = b?.status ?? "confirmé";
  $("#bookingDlg").showModal();
}

$("#addBooking").addEventListener("click", () => openBookingForm(null));

$("#bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const phone = Api.normalizePhone(f.phone.value);
  const err = $("#bookingError");
  if (!f.name.value.trim()) return (err.textContent = "Nom obligatoire.");
  if (!/^\d{8}$/.test(phone)) return (err.textContent = "Téléphone : 8 chiffres.");
  if (!f.date.value || !f.time.value) return (err.textContent = "Date et heure obligatoires.");
  const data = {
    status: f.status.value,
    name: f.name.value.trim(), phone, date: f.date.value, time: f.time.value,
    note: f.note.value.trim(), serviceIds: [...f.services.selectedOptions].map((o) => o.value)
  };
  try {
    if (editingBookingId) {
      await Api.updateBooking(editingBookingId, data);
      toast("Réservation modifiée");
    } else {
      await Api.createBooking({ ...data, lang: "fr" });
      toast("Réservation ajoutée");
    }
    $("#bookingDlg").close();
    reloadBookings();
  } catch (e2) {
    err.textContent = errText(e2);
  }
});

// ---------- Services ----------
function renderServices() {
  const filter = $("#catFilter");
  const current = filter.value;
  filter.innerHTML = `<option value="">Toutes les catégories</option>` +
    catalog.categories.map((c) => `<option value="${esc(c.id)}">${esc(tr(c.name, "fr"))}</option>`).join("");
  filter.value = current;

  const cats = catalog.categories.filter((c) => !filter.value || c.id === filter.value);
  $("#serviceList").innerHTML = cats.map((c) => {
    const list = catalog.services.filter((s) => s.cat === c.id);
    return `<div class="svc-group">
      <h3>${c.icon} ${esc(tr(c.name, "fr"))} <small class="muted">(${list.length})</small></h3>
      ${list.map((s) => `
        <div class="svc${s.active === false ? " off" : ""}">
          ${s.image ? `<img class="svc-thumb" src="${esc(s.image)}" alt="" loading="lazy">` : `<span class="svc-thumb ph" aria-hidden="true">${esc(c.icon || "")}</span>`}
          <div class="svc-name">${esc(s.name.fr)}<small dir="rtl">${esc(s.name.ar || "")}</small></div>
          <div class="tags">
            ${s.featured ? `<span class="tag">⭐ avant</span>` : ""}
            ${s.bridal ? `<span class="tag">💍</span>` : ""}
            ${s.active === false ? `<span class="tag">masqué</span>` : ""}
          </div>
          <span class="price">${s.oldPrice ? `<s class="old">${s.oldPrice}</s>` : ""}${s.price != null ? `<b>${s.price}</b> DT` : `<i>sur demande</i>`}</span>
          <button class="mini" data-edit="${esc(s.id)}">Modifier</button>
          <button class="mini bad" data-del="${esc(s.id)}" aria-label="Supprimer">🗑</button>
        </div>`).join("") || `<p class="muted">Aucun service.</p>`}
    </div>`;
  }).join("");
  renderCategories(); // garde à jour le nombre de services par catégorie
}

$("#catFilter").addEventListener("change", renderServices);

$("#serviceList").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-del]");
  if (edit) openServiceForm(edit.dataset.edit);
  if (del) {
    const s = catalog.services.find((x) => x.id === del.dataset.del);
    if (!s || !confirm(`Supprimer « ${s.name.fr} » ?`)) return;
    catalog.services = catalog.services.filter((x) => x.id !== s.id);
    if (await saveCatalog("Service supprimé")) Api.deleteImage(s.image);
    renderServices();
  }
});

$("#addService").addEventListener("click", () => openServiceForm(null));

function openServiceForm(id) {
  editingId = id;
  const s = id ? catalog.services.find((x) => x.id === id) : { cat: $("#catFilter").value || "packs", active: true };
  const f = $("#serviceForm");
  f.reset();
  $("#serviceError").textContent = "";
  $("#serviceDlgTitle").textContent = id ? "Modifier le service" : "Nouveau service";
  f.cat.innerHTML = catalog.categories.map((c) => `<option value="${esc(c.id)}">${esc(tr(c.name, "fr"))}</option>`).join("");
  f.cat.value = s.cat;
  f.nameFr.value = s.name?.fr || "";
  f.nameAr.value = s.name?.ar || "";
  f.descFr.value = s.desc?.fr || "";
  f.descAr.value = s.desc?.ar || "";
  f.price.value = s.price ?? "";
  f.oldPrice.value = s.oldPrice ?? "";
  f.duration.value = s.duration ?? "";
  f.badge.value = s.badge ? [s.badge.fr, s.badge.ar].filter(Boolean).join(" | ") : "";
  f.items.value = (s.items || []).map((i) => [i.fr, i.ar].filter(Boolean).join(" | ")).join("\n");
  f.active.checked = s.active !== false;
  f.featured.checked = !!s.featured;
  f.bridal.checked = !!s.bridal;
  formImage = s.image || null;
  renderImageField();
  $("#moreOpts").open = false; // nouveau service : juste photo + nom ; options repliées
  $("#serviceDlg").showModal();
}

// ---------- Photo du service ----------
let formImage = null; // adresse de la photo affichée dans le formulaire

function renderImageField(busy = false) {
  $("#imgPreview").innerHTML = busy
    ? `<span class="muted">Envoi…</span>`
    : formImage ? `<img src="${esc(formImage)}" alt="">` : `<span class="muted">Pas de photo</span>`;
  $("#imgRemove").hidden = !formImage || busy;
  $("#imgPickLabel").textContent = formImage ? "Changer la photo" : "Choisir une photo";
}

// Réduit la photo (1200 px max, JPEG) avant l'envoi : rapide même en 4G.
async function shrinkImage(file, max = 1200) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
}

$("#imgInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  renderImageField(true);
  try {
    formImage = await Api.uploadImage(await shrinkImage(file));
    $("#serviceError").textContent = "";
  } catch (err) {
    toast("Photo : " + errText(err));
  }
  renderImageField();
});

$("#imgRemove").addEventListener("click", () => {
  formImage = null;
  renderImageField();
});

const splitFrAr = (line) => {
  const [fr, ar] = line.split("|").map((x) => x.trim());
  return { fr, ar: ar || "" };
};
const num = (v) => (v === "" ? null : Number(v));

$("#serviceForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const nameFr = f.nameFr.value.trim();
  if (!nameFr) return ($("#serviceError").textContent = "Le nom du service est obligatoire.");
  if (!formImage && !editingId) return ($("#serviceError").textContent = "Ajoutez une photo du service.");
  const descFr = f.descFr.value.trim();
  const descAr = f.descAr.value.trim();

  const data = {
    cat: f.cat.value,
    name: { fr: nameFr, ar: f.nameAr.value.trim() },
    desc: descFr || descAr ? { fr: descFr, ar: descAr } : null,
    price: num(f.price.value),
    oldPrice: num(f.oldPrice.value),
    duration: num(f.duration.value),
    badge: f.badge.value.trim() ? splitFrAr(f.badge.value) : null,
    items: f.items.value.split("\n").map((l) => l.trim()).filter(Boolean).map(splitFrAr),
    active: f.active.checked,
    featured: f.featured.checked,
    bridal: f.bridal.checked,
    image: formImage
  };

  const oldImage = editingId ? catalog.services.find((s) => s.id === editingId)?.image : null;
  if (editingId) {
    catalog.services = catalog.services.map((s) => (s.id === editingId ? { ...s, ...data } : s));
  } else {
    catalog.services.push({ id: crypto.randomUUID(), ...data });
  }
  if (await saveCatalog()) {
    if (oldImage && oldImage !== formImage) Api.deleteImage(oldImage); // ancienne photo remplacée
    $("#serviceDlg").close();
    renderServices();
  }
});

// ---------- Catégories ----------
let editingCatId = null;

function renderCategories() {
  const cats = catalog.categories;
  $("#categoryList").innerHTML = cats.map((c, i) => {
    const n = catalog.services.filter((s) => s.cat === c.id).length;
    return `<div class="svc">
      <div class="svc-name">${esc(c.icon || "")} ${esc(c.name.fr)}<small dir="rtl">${esc(c.name.ar || "")}</small></div>
      <span class="tag">${n} service${n > 1 ? "s" : ""}</span>
      <button class="mini" data-move="${i}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Monter">▲</button>
      <button class="mini" data-move="${i}" data-dir="1" ${i === cats.length - 1 ? "disabled" : ""} aria-label="Descendre">▼</button>
      <button class="mini" data-edit-cat="${esc(c.id)}">Modifier</button>
      <button class="mini bad" data-del-cat="${esc(c.id)}" aria-label="Supprimer">🗑</button>
    </div>`;
  }).join("") || `<p class="empty">Aucune catégorie.</p>`;
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "categorie";

$("#categoryList").addEventListener("click", async (e) => {
  const move = e.target.closest("[data-move]");
  const edit = e.target.closest("[data-edit-cat]");
  const del = e.target.closest("[data-del-cat]");
  if (move) {
    const i = Number(move.dataset.move);
    const j = i + Number(move.dataset.dir);
    [catalog.categories[i], catalog.categories[j]] = [catalog.categories[j], catalog.categories[i]];
    await saveCatalog("Ordre enregistré");
  } else if (edit) {
    return openCategoryForm(edit.dataset.editCat);
  } else if (del) {
    const c = catalog.categories.find((x) => x.id === del.dataset.delCat);
    const n = catalog.services.filter((s) => s.cat === c.id).length;
    const msg = n
      ? `Supprimer « ${c.name.fr} » ET ses ${n} service(s) ? Cette action est définitive.`
      : `Supprimer la catégorie « ${c.name.fr} » ?`;
    if (!confirm(msg)) return;
    const removed = catalog.services.filter((s) => s.cat === c.id);
    catalog.categories = catalog.categories.filter((x) => x.id !== c.id);
    catalog.services = catalog.services.filter((s) => s.cat !== c.id);
    if (await saveCatalog("Catégorie supprimée")) removed.forEach((s) => Api.deleteImage(s.image));
  } else {
    return;
  }
  renderCategories();
  renderServices();
});

function openCategoryForm(id) {
  const c = id ? catalog.categories.find((x) => x.id === id) : null;
  editingCatId = c?.id ?? null;
  const f = $("#categoryForm");
  f.reset();
  $("#categoryError").textContent = "";
  $("#categoryDlgTitle").textContent = c ? "Modifier la catégorie" : "Nouvelle catégorie";
  f.icon.value = c?.icon ?? "";
  f.nameFr.value = c?.name.fr ?? "";
  f.nameAr.value = c?.name.ar ?? "";
  $("#categoryDlg").showModal();
}

$("#addCategory").addEventListener("click", () => openCategoryForm(null));

$("#categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const nameFr = f.nameFr.value.trim();
  if (!nameFr) return ($("#categoryError").textContent = "Le nom (FR) est obligatoire.");
  const data = { icon: f.icon.value.trim() || "✨", name: { fr: nameFr, ar: f.nameAr.value.trim() } };
  if (editingCatId) {
    Object.assign(catalog.categories.find((c) => c.id === editingCatId), data);
  } else {
    let id = slugify(nameFr);
    for (let k = 2; catalog.categories.some((c) => c.id === id); k++) id = `${slugify(nameFr)}-${k}`;
    catalog.categories.push({ id, ...data });
  }
  if (await saveCatalog()) {
    $("#categoryDlg").close();
    renderCategories();
    renderServices();
  }
});

// ---------- Clientes et comptes ----------
let users = [];
let me = null;
let editingUserId = null;

async function loadUsers() {
  try {
    users = await Api.users();
    renderUsers();
  } catch (e) {
    toast("Erreur : " + errText(e));
  }
}

function renderUsers() {
  const q = $("#userSearch").value.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const role = $("#roleFilter").value;
  const list = users.filter((u) =>
    (!role || u.role === role) &&
    (!q || u.full_name.toLowerCase().includes(q) || (digits && u.phone.includes(digits)))
  );
  $("#userList").innerHTML = list.length
    ? list.map((u) => `
      <div class="svc">
        <div class="svc-name">${esc(u.full_name)}${u.id === me?.id ? " (vous)" : ""}
          <small dir="ltr">📞 ${esc(u.phone)} · inscrite le ${esc(new Date(u.created_at).toLocaleDateString("fr-FR"))}</small>
        </div>
        <div class="tags">
          ${u.role === "admin" ? `<span class="tag">🔑 admin</span>` : ""}
          <span class="tag">${u.bookings} RDV</span>
        </div>
        <button class="mini" data-edit-user="${esc(u.id)}">Modifier</button>
        <a class="mini" href="tel:+216${esc(u.phone)}">Appeler</a>
        ${u.id === me?.id ? "" : `<button class="mini bad" data-del-user="${esc(u.id)}" aria-label="Supprimer">🗑</button>`}
      </div>`).join("")
    : `<p class="empty">Aucun compte.</p>`;
}

$("#userSearch").addEventListener("input", renderUsers);
$("#roleFilter").addEventListener("change", renderUsers);
$("#addUser").addEventListener("click", () => openUserForm(null));

$("#userList").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit-user]");
  const del = e.target.closest("[data-del-user]");
  if (edit) return openUserForm(edit.dataset.editUser);
  if (!del) return;
  const u = users.find((x) => x.id === del.dataset.delUser);
  if (!confirm(`Supprimer le compte de ${u.full_name} ? Ses ${u.bookings} rendez-vous restent dans l'historique.`)) return;
  try {
    await Api.deleteUser(u.id);
    toast("Compte supprimé");
    loadUsers();
  } catch (err) {
    toast("Erreur : " + errText(err));
  }
});

function openUserForm(id) {
  const u = id ? users.find((x) => x.id === id) : null;
  editingUserId = u?.id ?? null;
  const f = $("#userForm");
  f.reset();
  $("#userError").textContent = "";
  $("#userDlgTitle").textContent = u ? "Modifier le compte" : "Nouveau compte";
  $("#userPwLabel").textContent = u ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe";
  $("#userPwHint").textContent = u ? "Si la cliente a oublié son mot de passe, mettez-en un nouveau et communiquez-le-lui." : "";
  f.fullName.value = u?.full_name ?? "";
  f.phone.value = u?.phone ?? "";
  f.role.value = u?.role ?? "client";
  f.role.disabled = u?.id === me?.id; // on ne retire pas son propre accès
  $("#userDlg").showModal();
}

$("#userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const err = $("#userError");
  const data = { fullName: f.fullName.value.trim(), phone: Api.normalizePhone(f.phone.value), role: f.role.value };
  if (!data.fullName) return (err.textContent = "Nom obligatoire.");
  if (!/^\d{8}$/.test(data.phone)) return (err.textContent = "Téléphone : 8 chiffres.");
  if (f.password.value) data.password = f.password.value;
  else if (!editingUserId) return (err.textContent = "Mot de passe obligatoire (6 caractères minimum).");
  if (data.password && data.password.length < 6) return (err.textContent = "Mot de passe : 6 caractères minimum.");
  try {
    if (editingUserId) {
      await Api.updateUser(editingUserId, data);
      toast("Compte modifié");
    } else {
      await Api.createUser(data);
      toast("Compte créé");
    }
    $("#userDlg").close();
    loadUsers();
  } catch (e2) {
    err.textContent = errText(e2);
  }
});

// ---------- Site : textes et photo de l'accueil ----------
// [groupe, [[clé, libellé, texte long ?]]] — les clés sont celles de settings.texts.
const SITE_FIELDS = [
  ["Accueil", [["tagline", "Petite ligne au-dessus du titre"], ["heroTitle", "Grand titre"], ["heroText", "Texte d'accueil", true],
    ["exp", "Badge 1"], ["brands", "Badge 2"]]],
  ["Packs", [["packsKicker", "Sur-titre"], ["packsTitle", "Titre"], ["packsSub", "Sous-titre"]]],
  ["Chiffres", [["whyYears", "Texte sous les années"], ["whyBrands", "Texte sous les marques"]]],
  ["Spécial mariée", [["brideKicker", "Sur-titre"], ["brideTitle", "Titre"], ["brideSub", "Sous-titre", true]]],
  ["Tous nos services", [["servicesKicker", "Sur-titre"], ["servicesTitle", "Titre"]]],
  ["Contact", [["contactTitle", "Titre"]]]
];
const DEFAULTS = window.PALM_DEFAULT.settings;
let siteHero = null; // photo d'accueil affichée dans le formulaire (null = photo d'origine)

function renderSite() {
  const texts = { ...DEFAULTS.texts, ...(catalog.settings.texts || {}) };
  $("#siteTexts").innerHTML = SITE_FIELDS.map(([group, fields]) => `
    <div class="settings">
      <h3>${esc(group)}</h3>
      ${fields.map(([key, label, long]) => {
        const v = texts[key] || { fr: "", ar: "" };
        const field = (lang) => long
          ? `<textarea name="${key}.${lang}" rows="3"${lang === "ar" ? ' dir="rtl"' : ""}>${esc(v[lang])}</textarea>`
          : `<input name="${key}.${lang}" value="${esc(v[lang])}"${lang === "ar" ? ' dir="rtl"' : ""}>`;
        return `<div class="two"><label>${esc(label)} (FR) ${field("fr")}</label><label>${esc(label)} (AR) ${field("ar")}</label></div>`;
      }).join("")}
    </div>`).join("");
  const stats = catalog.settings.stats || DEFAULTS.stats;
  $("#siteForm").statYears.value = stats.years;
  $("#siteForm").statBrands.value = stats.brands;
  siteHero = catalog.settings.heroImage || null;
  renderHeroPreview();
}

function renderHeroPreview(busy = false) {
  $("#heroPreview").innerHTML = busy ? `<span class="muted">Envoi…</span>` : `<img src="${esc(siteHero || "img/hero.jpg")}" alt="">`;
  $("#heroReset").hidden = !siteHero;
}

$("#heroInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  renderHeroPreview(true);
  try {
    siteHero = await Api.uploadImage(await shrinkImage(file, 1920));
  } catch (err) {
    toast("Photo : " + errText(err));
  }
  renderHeroPreview();
});

$("#heroReset").addEventListener("click", () => {
  siteHero = null;
  renderHeroPreview();
});

$("#siteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const texts = {};
  for (const [, fields] of SITE_FIELDS) {
    for (const [key] of fields) {
      texts[key] = { fr: f[`${key}.fr`].value.trim(), ar: f[`${key}.ar`].value.trim() };
    }
  }
  const oldHero = catalog.settings.heroImage;
  catalog.settings.texts = texts;
  catalog.settings.stats = { years: Number(f.statYears.value) || 0, brands: Number(f.statBrands.value) || 0 };
  catalog.settings.heroImage = siteHero;
  if (await saveCatalog("Site enregistré ✅") && oldHero && oldHero !== siteHero) Api.deleteImage(oldHero);
});

$("#siteReset").addEventListener("click", async () => {
  if (!confirm("Remettre tous les textes, chiffres et la photo d'accueil d'origine ?")) return;
  const oldHero = catalog.settings.heroImage;
  catalog.settings.texts = JSON.parse(JSON.stringify(DEFAULTS.texts));
  catalog.settings.stats = { ...DEFAULTS.stats };
  catalog.settings.heroImage = null;
  if (await saveCatalog("Textes d'origine rétablis")) {
    Api.deleteImage(oldHero);
    renderSite();
  }
});

// ---------- Mon mot de passe ----------
$("#passwordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const err = $("#passwordError");
  if (f.next.value.length < 6) return (err.textContent = "Nouveau mot de passe : 6 caractères minimum.");
  if (f.next.value !== f.confirm.value) return (err.textContent = "Les deux nouveaux mots de passe ne sont pas identiques.");
  err.textContent = "";
  try {
    await Api.changePassword(f.current.value, f.next.value);
    f.reset();
    toast("Mot de passe changé ✅");
  } catch (e2) {
    err.textContent = errText(e2);
  }
});

// ---------- Paramètres ----------
function fillSettings() {
  const s = catalog.settings;
  const f = $("#settingsForm");
  f.phone.value = s.phone;
  f.instagram.value = s.instagram;
  f.cityFr.value = s.city.fr;
  f.cityAr.value = s.city.ar;
  f.openHour.value = s.openHour;
  f.closeHour.value = s.closeHour;
}

$("#settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const open = Number(f.openHour.value);
  const close = Number(f.closeHour.value);
  if (!(close > open)) return toast("L'heure de fermeture doit être après l'ouverture");
  Object.assign(catalog.settings, {
    phone: f.phone.value.trim(),
    instagram: f.instagram.value.trim().replace(/^@/, ""),
    city: { fr: f.cityFr.value.trim(), ar: f.cityAr.value.trim() },
    openHour: open,
    closeHour: close
  });
  await saveCatalog("Paramètres enregistrés");
});

// Fermeture des dialogues
$$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
$$("dialog").forEach((d) => d.addEventListener("click", (e) => e.target === d && d.close()));

// ---------- Démarrage ----------
Api.registerServiceWorker();
if (!Api.configured) {
  $("#setupBanner").hidden = false;
  $("#loginForm button").disabled = true;
} else {
  Api.user().then(enter);
  // Nouvelle réservation ou annulation par une cliente : la liste se met à jour seule.
  Api.watchBookings(() => {
    if (!$("#app").hidden) reloadBookings();
  });
  // Notification reçue pendant que l'admin est ouvert à l'écran.
  Api.onForegroundMessage((d) => {
    toast(d.title || "Nouvelle notification");
    if (!$("#app").hidden) reloadBookings();
  });
}
