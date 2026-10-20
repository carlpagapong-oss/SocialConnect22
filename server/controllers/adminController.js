import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listAccounts = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT a.account_id AS id, a.username, a.email, a.role, a.account_status,
            a.created_at, p.display_name AS name
     FROM account a
     LEFT JOIN profile p ON p.account_id = a.account_id
     ORDER BY a.created_at DESC`,
  );

  res.json({
    accounts: rows.map((account) => ({
      ...account,
      id: String(account.id),
    })),
  });
});

export const updateAccountStatus = asyncHandler(async (req, res) => {
  const accountId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(accountId) || !["active", "disabled"].includes(status)) {
    throw new ApiError(400, "A valid account ID and status are required");
  }
  if (accountId === Number(req.user.id)) {
    throw new ApiError(400, "You cannot change your own account status");
  }

  const [result] = await pool.query(
    "UPDATE account SET account_status = ? WHERE account_id = ?",
    [status, accountId],
  );
  if (result.affectedRows === 0) throw new ApiError(404, "Account not found");

  const [rows] = await pool.query(
    `SELECT a.account_id AS id, a.username, a.email, a.role, a.account_status,
            a.created_at, p.display_name AS name
     FROM account a
     LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE a.account_id = ?`,
    [accountId],
  );

  res.json({ account: { ...rows[0], id: String(rows[0].id) } });
});
