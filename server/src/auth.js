import jwt from "jsonwebtoken";
import { query } from "./db.js";

const SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "60d";

export const normalizePhone = (p) => String(p ?? "").replace(/\D/g, "").replace(/^216(?=\d{8}$)/, "");

export const publicUser = (u) => ({ id: u.id, full_name: u.full_name, phone: u.phone, role: u.role });

export const signToken = (user) => jwt.sign({ sub: user.id }, SECRET, { expiresIn: TOKEN_TTL });

// Relit l'utilisateur en base à chaque requête : un rôle retiré ou un compte
// supprimé prend effet immédiatement.
export async function userFromToken(token) {
  try {
    const { sub } = jwt.verify(token, SECRET);
    const { rows } = await query("select * from users where id = $1", [sub]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token && (await userFromToken(token));
  if (!user) return res.status(401).json({ error: "Non connecté" });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Accès réservé à l'admin" });
  next();
}
