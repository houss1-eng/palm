import fs from "node:fs";
import vm from "node:vm";
import { query } from "./db.js";

// Le catalogue par défaut est celui de app/js/data.js (une seule source pour
// le site et le serveur).
function loadDefault() {
  const code = fs.readFileSync(new URL("../../app/js/data.js", import.meta.url), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.PALM_DEFAULT;
}

const DEFAULT_CATALOG = loadDefault();

export async function getCatalog() {
  const { rows } = await query("select value from settings where key = 'catalog'");
  return rows[0]?.value ?? DEFAULT_CATALOG;
}

export async function saveCatalog(catalog) {
  await query(
    `insert into settings (key, value, updated_at) values ('catalog', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [catalog]
  );
}
