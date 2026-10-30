// Remplace le mot de passe d'un compte existant (mot de passe oublié).
// Usage : npm run set-password -- 22807207 NouveauMotDePasse
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";
import { normalizePhone } from "../src/auth.js";

const phone = normalizePhone(process.argv[2]);
const password = String(process.argv[3] ?? "");
if (!/^\d{8}$/.test(phone) || password.length < 6) {
  console.error("Usage : npm run set-password -- NUMERO (8 chiffres) MOT_DE_PASSE (6 caractères minimum)");
  process.exit(1);
}

const { rows } = await pool.query("update users set password_hash = $1 where phone = $2 returning full_name, role",
  [await bcrypt.hash(password, 10), phone]);
if (rows[0]) {
  console.log(`✅ Mot de passe changé pour ${rows[0].full_name} (${phone}, rôle : ${rows[0].role}).`);
} else {
  console.error(`❌ Aucun compte avec le numéro ${phone}. Créez d'abord le compte depuis l'app (Mon espace > Créer un compte).`);
  process.exitCode = 1;
}
await pool.end();
