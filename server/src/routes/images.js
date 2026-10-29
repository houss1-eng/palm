// Photos des services : envoi par l'admin, affichage public.
import express, { Router } from "express";
import { query } from "../db.js";
import { requireAdmin, requireUser } from "../auth.js";

const router = Router();
const TYPES = ["image/jpeg", "image/png", "image/webp"];

router.get("/:id", async (req, res) => {
  const { rows } = await query("select mime, data from images where id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).end();
  // Une photo ne change jamais (une nouvelle photo = un nouvel id) : cache long.
  res.set({ "Content-Type": rows[0].mime, "Cache-Control": "public, max-age=31536000, immutable" });
  res.send(rows[0].data);
});

router.post("/", requireUser, requireAdmin, express.raw({ type: TYPES, limit: "6mb" }), async (req, res) => {
  const mime = req.get("content-type");
  if (!TYPES.includes(mime) || !Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ error: "Format accepté : JPG, PNG ou WebP" });
  }
  const { rows } = await query("insert into images (mime, data) values ($1, $2) returning id", [mime, req.body]);
  res.status(201).json({ url: `/api/images/${rows[0].id}` });
});

router.delete("/:id", requireUser, requireAdmin, async (req, res) => {
  await query("delete from images where id = $1", [req.params.id]);
  res.status(204).end();
});

export default router;
