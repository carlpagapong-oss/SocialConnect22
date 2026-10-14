import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import { getUserById, getUserByUsername, serializeUser } from "../utils/sql.js";

const normalizeUsername = (value = "") => value.trim().replace(/^@/, "").toLowerCase();

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, birthday, gender } = req.body;
  const normalizedUsername = normalizeUsername(username);
  if (!name || !normalizedUsername || !email || !password) {
    throw new ApiError(400, "Name, username, email and password are required");
  }
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const [existing] = await pool.query(
    "SELECT account_id FROM account WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1",
    [normalizedUsername, email.trim().toLowerCase()],
  );
  if (existing.length) throw new ApiError(409, "Username or email is already in use");

  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [account] = await connection.query(
      "INSERT INTO account (username, email, password_hash, account_status) VALUES (?, ?, ?, ?)",
      [normalizedUsername, email.trim().toLowerCase(), passwordHash, "active"],
    );
    const accountId = account.insertId;
    await connection.query(
      `INSERT INTO profile
       (account_id, display_name, birthday, gender, bio, relation_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [accountId, name.trim(), birthday || null, gender || "Prefer not to say", "", ""],
    );
    await connection.commit();
    const user = await getUserById(accountId);
    res.status(201).json({ token: generateToken(accountId), user: serializeUser(user, accountId) });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw new ApiError(409, "Username or email is already in use");
    throw error;
  } finally {
    connection.release();
  }
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, "Enter your username or email and password");

  const needle = identifier.trim().toLowerCase();
  const user = await getUserByUsername(needle);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Incorrect username/email or password");
  }

  res.json({ token: generateToken(user.id), user: serializeUser(user, user.id) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user, req.user.id) });
});
