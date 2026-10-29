import fs from "node:fs";
import pg from "pg";

// Renvoyer les dates "AAAA-MM-JJ" telles quelles (pas de décalage de fuseau)
// et les montants numeric en nombres.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => Number(v));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);

export async function migrate() {
  const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
}
