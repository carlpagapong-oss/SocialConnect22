import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import {
  getUserById,
  getUserByIdentifier,
  getUserByEmail,
  getUserByUsername,
  serializeUser,
} from "../utils/sql.js";
import {
  issueLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
} from "../utils/loginOtp.js";

const normalizeUsername = (value = "") => value.trim().replace(/^@/, "").toLowerCase();

const isAtLeast17 = (birthday) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return false;

  const [year, month, day] = birthday.split("-").map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear() - 17, today.getUTCMonth(), today.getUTCDate()),
  );
  return birthDate <= cutoff;
};

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, birthday, gender } = req.body;
  const normalizedUsername = normalizeUsername(username);
  if (!name || !normalizedUsername || !email || !password) {
    throw new ApiError(400, "Name, username, email and password are required");
  }
  if (!birthday || !isAtLeast17(birthday)) {
    throw new ApiError(400, "You must be at least 17 years old to sign up");
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
      "INSERT INTO account (username, email, password_hash, role, account_status) VALUES (?, ?, ?, ?, ?)",
      [normalizedUsername, email.trim().toLowerCase(), passwordHash, "user", "active"],
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

  const needle = identifier.trim().replace(/^@/, "").toLowerCase();
  const user = await getUserByIdentifier(needle);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Incorrect username/email or password");
  }
  if (user.account_status === "deactivated") {
    throw new ApiError(
      403,
      "Your account has been deactivated by an administrator. Please contact the admin.",
    );
  }

  res.json({
    ...issueLoginOtp(user.id, user.email),
  });
});

export const verifyLoginCode = asyncHandler(async (req, res) => {
  const { challengeId, code } = req.body;
  if (!challengeId || !/^\d{6}$/.test(code || "")) {
    throw new ApiError(400, "Enter the 6-digit authentication code");
  }

  const accountId = verifyLoginOtp(challengeId, code);
  const user = await getUserById(accountId);
  if (!user) throw new ApiError(401, "Your account could not be found");

  res.json({ token: generateToken(accountId), user: serializeUser(user, accountId) });
});

export const resendLoginCode = asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  if (!challengeId) throw new ApiError(400, "Authentication session is required");

  const { accountId, resendCount } = resendLoginOtp(challengeId);
  const user = await getUserById(accountId);
  if (!user) throw new ApiError(401, "Your account could not be found");

  res.json(issueLoginOtp(user.id, user.email, resendCount));
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Enter your registered email");

  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) throw new ApiError(404, "This email is not registered in the app");

  res.json({
    ...issueLoginOtp(user.id, user.email),
    email: user.email,
  });
});

export const resendPasswordResetCode = asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  if (!challengeId) throw new ApiError(400, "Authentication session is required");

  const { accountId, resendCount } = resendLoginOtp(challengeId);
  const user = await getUserById(accountId);
  if (!user) throw new ApiError(404, "This email is not registered in the app");

  res.json({
    ...issueLoginOtp(user.id, user.email, resendCount),
    email: user.email,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user) throw new ApiError(404, "This email is not registered in the app");

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query("UPDATE account SET password_hash = ? WHERE account_id = ?", [
    passwordHash,
    user.id,
  ]);
  res.json({ message: "Password updated successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user, req.user.id) });
});
