// Donne le rôle admin à un compte existant.
// Usage : npm run make-admin -- 22807207
import "dotenv/config";
import { pool } from "../src/db.js";
import { normalizePhone } from "../src/auth.js";

const phone = normalizePhone(process.argv[2]);
if (!/^\d{8}$/.test(phone)) {
  console.error("Usage : npm run make-admin -- NUMERO (8 chiffres)");
  process.exit(1);
}

const { rows } = await pool.query("update users set role = 'admin' where phone = $1 returning full_name", [phone]);
if (rows[0]) {
  console.log(`✅ ${rows[0].full_name} (${phone}) est maintenant admin.`);
} else {
  console.error(`❌ Aucun compte avec le numéro ${phone}. Créez d'abord le compte depuis l'app (Mon espace > Créer un compte).`);
  process.exitCode = 1;
}
await pool.end();
