import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import { migrate } from "./db.js";
import { initPush } from "./notify.js";
import { userFromToken } from "./auth.js";
import { subscribe } from "./events.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import bookingRoutes from "./routes/bookings.js";
import pushRoutes from "./routes/push.js";
import userRoutes from "./routes/users.js";
import imageRoutes from "./routes/images.js";

for (const key of ["DATABASE_URL", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`❌ Variable ${key} manquante : copiez server/.env.example en server/.env et remplissez-le.`);
    process.exit(1);
  }
}

const app = express();
app.set("trust proxy", 1); // derrière l'hébergeur (Render…), pour la limite d'essais par IP
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/users", userRoutes);
app.use("/api/images", imageRoutes);

// Flux temps réel. EventSource ne peut pas envoyer d'en-tête, le jeton passe en paramètre.
app.get("/api/events", async (req, res) => {
  const user = await userFromToken(String(req.query.token ?? ""));
  if (!user) return res.status(401).end();
  subscribe(req, res, user);
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", (_req, res) => res.status(404).json({ error: "Route inconnue" }));

// Le site (dossier app/) est servi par le même serveur.
const appDir = fileURLToPath(new URL("../../app", import.meta.url));
app.use(express.static(appDir, {
  setHeaders(res, path) {
    // Le service worker doit toujours être relu pour que les mises à jour arrivent.
    if (path.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache");
  }
}));

// Erreurs : message clair pour l'app, détail dans la console du serveur.
app.use((err, _req, res, _next) => {
  if (err.code === "22P02") return res.status(404).json({ error: "Introuvable" }); // identifiant mal formé
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Requête invalide" });
  console.error(err);
  res.status(500).json({ error: "Erreur du serveur" });
});

const port = Number(process.env.PORT) || 3000;
await migrate();
initPush();
app.listen(port, () => {
  console.log(`🌴 Palm Beauty Centre : http://localhost:${port}`);
  console.log(`   Admin           : http://localhost:${port}/admin.html`);
});
