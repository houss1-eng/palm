// Gestion des comptes (clientes et admins) — réservé à l'admin.
import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { normalizePhone, publicUser, requireAdmin, requireUser } from "../auth.js";

const router = Router();
router.use(requireUser, requireAdmin);

const ROLES = ["client", "admin"];

router.get("/", async (_req, res) => {
  const { rows } = await query(`
    select u.id, u.full_name, u.phone, u.role, u.created_at,
           count(b.id)::int as bookings,
           max(b.date) as last_booking
    from users u left join bookings b on b.user_id = u.id
    group by u.id
    order by u.created_at desc`);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const fullName = String(req.body.fullName ?? "").trim().slice(0, 80);
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password ?? "");
  const role = ROLES.includes(req.body.role) ? req.body.role : "client";
  if (!fullName) return res.status(400).json({ error: "Nom obligatoire" });
  if (!/^\d{8}$/.test(phone)) return res.status(400).json({ error: "Téléphone invalide (8 chiffres)" });
  if (password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum" });

  const { rows } = await query(
    `insert into users (full_name, phone, password_hash, role) values ($1, $2, $3, $4)
     on conflict (phone) do nothing returning *`,
    [fullName, phone, await bcrypt.hash(password, 10), role]
  );
  if (!rows[0]) return res.status(409).json({ error: "Ce numéro a déjà un compte" });
  res.status(201).json(publicUser(rows[0]));
});

router.patch("/:id", async (req, res) => {
  const { rows: found } = await query("select * from users where id = $1", [req.params.id]);
  const user = found[0];
  if (!user) return res.status(404).json({ error: "Compte introuvable" });

  const fullName = req.body.fullName === undefined ? user.full_name : String(req.body.fullName).trim().slice(0, 80);
  const phone = req.body.phone === undefined ? user.phone : normalizePhone(req.body.phone);
  const role = ROLES.includes(req.body.role) ? req.body.role : user.role;
  const password = req.body.password ? String(req.body.password) : null;
  if (!fullName) return res.status(400).json({ error: "Nom obligatoire" });
  if (!/^\d{8}$/.test(phone)) return res.status(400).json({ error: "Téléphone invalide (8 chiffres)" });
  if (password && password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum" });
  if (user.id === req.user.id && role !== "admin") return res.status(400).json({ error: "Vous ne pouvez pas retirer votre propre accès admin" });

  const clash = await query("select 1 from users where phone = $1 and id <> $2", [phone, user.id]);
  if (clash.rows.length) return res.status(409).json({ error: "Ce numéro a déjà un compte" });

  const { rows } = await query(
    `update users set full_name = $1, phone = $2, role = $3,
       password_hash = coalesce($4, password_hash)
     where id = $5 returning *`,
    [fullName, phone, role, password && (await bcrypt.hash(password, 10)), user.id]
  );
  res.json(publicUser(rows[0]));
});

// Les rendez-vous de la cliente sont gardés (sans lien vers le compte).
router.delete("/:id", async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
  await query("delete from users where id = $1", [req.params.id]);
  res.status(204).end();
});

export default router;
