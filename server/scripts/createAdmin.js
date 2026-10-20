import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((result, value, index, values) => {
    if (!value.startsWith("--")) return result;
    result.push([value.slice(2), values[index + 1]]);
    return result;
  }, []),
);

const required = ["username", "email", "password", "name", "birthday"];
const missing = required.filter((key) => !args[key]);

if (missing.length) {
  console.error(
    `Missing arguments: ${missing.map((key) => `--${key}`).join(", ")}`,
  );
  console.error(
    "Example: npm run create-admin -- --username admin --email admin@example.com --password ChangeMe123 --name Administrator --birthday 1990-01-01",
  );
  process.exitCode = 1;
} else {
  const username = args.username.trim().replace(/^@/, "").toLowerCase();
  const email = args.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(args.password, 12);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      "SELECT account_id FROM account WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1",
      [username, email],
    );
    if (existing.length) {
      throw new Error("That username or email is already registered");
    }

    const [account] = await connection.query(
      `INSERT INTO account
       (username, email, password_hash, role, account_status)
       VALUES (?, ?, ?, 'admin', 'active')`,
      [username, email, passwordHash],
    );
    await connection.query(
      `INSERT INTO profile
       (account_id, display_name, birthday, gender, bio, relation_status)
       VALUES (?, ?, ?, ?, '', '')`,
      [account.insertId, args.name.trim(), args.birthday, args.gender || "Prefer not to say"],
    );
    await connection.commit();
    console.log(`Admin account created for @${username}.`);
  } catch (error) {
    await connection.rollback();
    console.error(`Unable to create Admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}
