import { Router } from "express";
import { query } from "../db.js";
import { normalizePhone, requireAdmin, requireUser } from "../auth.js";
import { getCatalog } from "../catalog.js";
import { notifyAdmins, notifyClient, safely } from "../notify.js";
import { broadcastBooking } from "../events.js";

const router = Router();
router.use(requireUser);

const STATUSES = ["nouveau", "confirmé", "terminé", "annulé"];
const today = () => new Date().toISOString().slice(0, 10);

// Valide les champs d'une réservation ; les noms et prix des soins viennent du
// catalogue du serveur, jamais du navigateur.
async function readBooking(body, isAdmin) {
  const name = String(body.name ?? "").trim().slice(0, 80);
  const phone = normalizePhone(body.phone);
  const date = String(body.date ?? "");
  const time = String(body.time ?? "");
  if (!name) return { error: "Nom obligatoire" };
  if (!/^\d{8}$/.test(phone)) return { error: "Téléphone invalide" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (!isAdmin && date < today())) return { error: "Date invalide" };
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Heure invalide" };

  const catalog = await getCatalog();
  const ids = Array.isArray(body.serviceIds) ? body.serviceIds.slice(0, 30) : [];
  const services = ids
    .map((id) => catalog.services.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name.fr, price: s.price ?? null }));
  return {
    name, phone, date, time, services,
    note: String(body.note ?? "").trim().slice(0, 500),
    lang: body.lang === "ar" ? "ar" : "fr",
    total: services.reduce((sum, s) => sum + (s.price || 0), 0)
  };
}

router.get("/", async (req, res) => {
  const { rows } = req.user.role === "admin"
    ? await query("select * from bookings order by date, time")
    : await query("select * from bookings where user_id = $1 order by date desc, time desc", [req.user.id]);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const b = await readBooking(req.body, isAdmin);
  if (b.error) return res.status(400).json(b);

  // Une cliente réserve pour elle-même ; l'admin peut saisir un rendez-vous
  // pris par téléphone (sans compte) ou l'attribuer à une cliente inscrite.
  const userId = isAdmin ? (req.body.userId || null) : req.user.id;
  const status = isAdmin && STATUSES.includes(req.body.status) ? req.body.status : "nouveau";

  const { rows } = await query(
    `insert into bookings (user_id, name, phone, date, time, note, services, total, status, lang)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *`,
    [userId, b.name, b.phone, b.date, b.time, b.note, JSON.stringify(b.services), b.total, status, b.lang]
  );
  const booking = rows[0];
  broadcastBooking(booking);
  if (!isAdmin) safely(notifyAdmins(booking, "created"));
  res.status(201).json(booking);
});

// Modification complète par l'admin (date, heure, soins, nom, note, statut).
router.put("/:id", requireAdmin, async (req, res) => {
  const { rows: before } = await query("select * from bookings where id = $1", [req.params.id]);
  const old = before[0];
  if (!old) return res.status(404).json({ error: "Réservation introuvable" });

  const b = await readBooking({ ...req.body, lang: req.body.lang ?? old.lang }, true);
  if (b.error) return res.status(400).json(b);
  const status = STATUSES.includes(req.body.status) ? req.body.status : old.status;

  const { rows } = await query(
    `update bookings set name = $1, phone = $2, date = $3, time = $4, note = $5,
       services = $6, total = $7, status = $8
     where id = $9 returning *`,
    [b.name, b.phone, b.date, b.time, b.note, JSON.stringify(b.services), b.total, status, old.id]
  );
  const booking = rows[0];
  broadcastBooking(booking);
  // Prévenir la cliente : nouveau statut, ou nouvelle date/heure.
  if (status !== old.status) safely(notifyClient(booking));
  else if (booking.date !== old.date || booking.time !== old.time) safely(notifyClient(booking, "modifié"));
  res.json(booking);
});

router.patch("/:id", async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Statut invalide" });
  // Une cliente peut seulement annuler son propre rendez-vous.
  if (!isAdmin && status !== "annulé") return res.status(403).json({ error: "Seul le centre peut modifier ce rendez-vous" });

  const { rows } = await query(
    `update bookings set status = $1
     where id = $2 and ($3 or user_id = $4) returning *`,
    [status, req.params.id, isAdmin, req.user.id]
  );
  const booking = rows[0];
  if (!booking) return res.status(404).json({ error: "Réservation introuvable" });

  broadcastBooking(booking);
  safely(isAdmin ? notifyClient(booking) : notifyAdmins(booking, "status"));
  res.json(booking);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const { rows } = await query("delete from bookings where id = $1 returning id, user_id, status", [req.params.id]);
  if (rows[0]) broadcastBooking({ ...rows[0], status: "supprimé" });
  res.status(204).end();
});

export default router;
