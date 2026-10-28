import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const hash = await bcrypt.hash("admin12345678", 12);
const [r] = await pool.query("UPDATE account SET password_hash = ? WHERE LOWER(username) = 'admin'", [hash]);
console.log("updated", r.affectedRows);
await pool.end();
