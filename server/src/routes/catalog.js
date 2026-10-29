import { Router } from "express";
import { getCatalog, saveCatalog } from "../catalog.js";
import { requireAdmin, requireUser } from "../auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  res.json(await getCatalog());
});

router.put("/", requireUser, requireAdmin, async (req, res) => {
  const c = req.body;
  if (!c || !Array.isArray(c.services) || !Array.isArray(c.categories) || typeof c.settings !== "object") {
    return res.status(400).json({ error: "Catalogue invalide" });
  }
  await saveCatalog(c);
  res.json({ ok: true });
});

export default router;
