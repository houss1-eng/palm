import { Router } from "express";
import { query } from "../db.js";
import { requireUser } from "../auth.js";
import { publicKey } from "../notify.js";

const router = Router();

// Clé publique dont le navigateur a besoin pour s'abonner (publique, sans connexion).
router.get("/key", (_req, res) => {
  const key = publicKey();
  if (!key) return res.status(503).json({ error: "Notifications non configurées" });
  res.json({ key });
});

router.use(requireUser);

// Enregistre l'abonnement de cet appareil pour la personne connectée
// (remplace l'ancien propriétaire si le téléphone a changé de compte).
router.post("/", async (req, res) => {
  const sub = req.body.subscription;
  const endpoint = sub?.endpoint;
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !sub.keys?.p256dh || !sub.keys?.auth) {
    return res.status(400).json({ error: "Abonnement invalide" });
  }
  await query(
    `insert into push_subscriptions (endpoint, user_id, subscription) values ($1, $2, $3)
     on conflict (endpoint) do update set user_id = excluded.user_id, subscription = excluded.subscription, created_at = now()`,
    [endpoint, req.user.id, { endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }]
  );
  res.status(204).end();
});

router.delete("/", async (req, res) => {
  await query("delete from push_subscriptions where endpoint = $1 and user_id = $2", [String(req.body.endpoint ?? ""), req.user.id]);
  res.status(204).end();
});

export default router;
