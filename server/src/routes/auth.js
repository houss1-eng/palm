import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { query } from "../db.js";
import { normalizePhone, publicUser, requireUser, signToken } from "../auth.js";

const router = Router();

// Limite les essais de mot de passe (20 par 15 minutes et par adresse IP).
router.use(["/login", "/signup"], rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: "Trop d'essais, réessayez dans quelques minutes." } }));

router.post("/signup", async (req, res) => {
  const fullName = String(req.body.fullName ?? "").trim().slice(0, 80);
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password ?? "");
  if (!fullName) return res.status(400).json({ error: "Nom obligatoire" });
  if (!/^\d{8}$/.test(phone)) return res.status(400).json({ error: "Téléphone invalide" });
  if (password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum" });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `insert into users (full_name, phone, password_hash) values ($1, $2, $3)
     on conflict (phone) do nothing returning *`,
    [fullName, phone, hash]
  );
  if (!rows[0]) return res.status(409).json({ error: "already registered" });
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
});

router.post("/login", async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { rows } = await query("select * from users where phone = $1", [phone]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(String(req.body.password ?? ""), user.password_hash));
  if (!ok) return res.status(401).json({ error: "Invalid login credentials" });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireUser, (req, res) => res.json(publicUser(req.user)));

router.patch("/me", requireUser, async (req, res) => {
  const fullName = String(req.body.fullName ?? "").trim().slice(0, 80);
  if (!fullName) return res.status(400).json({ error: "Nom obligatoire" });
  const { rows } = await query("update users set full_name = $1 where id = $2 returning *", [fullName, req.user.id]);
  res.json(publicUser(rows[0]));
});

// Changement de mot de passe : l'ancien est exigé.
router.post("/password", requireUser, async (req, res) => {
  const ok = await bcrypt.compare(String(req.body.currentPassword ?? ""), req.user.password_hash);
  if (!ok) return res.status(400).json({ error: "Mot de passe actuel incorrect" });
  const next = String(req.body.newPassword ?? "");
  if (next.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum" });
  await query("update users set password_hash = $1 where id = $2", [await bcrypt.hash(next, 10), req.user.id]);
  res.status(204).end();
});

export default router;
