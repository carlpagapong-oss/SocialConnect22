import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { POST_FIELDS } from "./postController.js";
import { getUserById, getUserByUsername, serializePostRow, serializeUser } from "../utils/sql.js";

export const getSuggestions = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.account_id AS id, a.username, a.email, a.role, a.created_at AS account_created_at,
            p.display_name AS name, p.profile_picture AS avatar, p.background_picture AS cover,
            p.background_position AS coverPosition,
            p.bio, p.gender, p.birthday, p.relation_status AS relationshipStatus,
            (SELECT COUNT(*) FROM follow f WHERE f.following_id = a.account_id) AS followersCount,
            (SELECT COUNT(*) FROM follow f WHERE f.follower_id = a.account_id) AS followingCount,
            EXISTS(SELECT 1 FROM follow f WHERE f.follower_id = ? AND f.following_id = a.account_id) AS isFollowing
     FROM account a LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE a.account_id <> ?
       AND a.role <> 'admin'
       AND a.account_status = 'active'
     ORDER BY isFollowing ASC, a.created_at DESC LIMIT 5`,
    [req.user.id, req.user.id],
  );
  res.json({ users: rows.map((row) => serializeUser(row, req.user.id)) });
});

export const getDirectory = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.account_id AS id, a.username, a.email, a.role, a.created_at AS account_created_at,
            p.display_name AS name, p.profile_picture AS avatar, p.background_picture AS cover,
            p.background_position AS coverPosition,
            p.bio, p.gender, p.birthday, p.relation_status AS relationshipStatus,
            (SELECT COUNT(*) FROM follow f WHERE f.following_id = a.account_id) AS followersCount,
            (SELECT COUNT(*) FROM follow f WHERE f.follower_id = a.account_id) AS followingCount,
            EXISTS(SELECT 1 FROM follow f WHERE f.follower_id = ? AND f.following_id = a.account_id) AS isFollowing
     FROM account a LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE a.account_id <> ? AND a.role <> 'admin' AND a.account_status = 'active'
     ORDER BY a.created_at DESC`,
    [req.user.id, req.user.id],
  );
  res.json({ users: rows.map((row) => serializeUser(row, req.user.id)) });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) throw new ApiError(404, "We couldn't find that person");
  const [following] = await pool.query(
    "SELECT 1 FROM follow WHERE follower_id = ? AND following_id = ? LIMIT 1",
    [req.user.id, user.id],
  );
  user.isFollowing = following.length > 0;
  res.json({ user: serializeUser(user, req.user.id) });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) throw new ApiError(404, "We couldn't find that person");
  const [rows] = await pool.query(
    `SELECT ${POST_FIELDS} FROM post p
     JOIN account a ON a.account_id = p.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     LEFT JOIN post op ON op.post_id = p.original_post_id
     LEFT JOIN account oa ON oa.account_id = op.account_id
     LEFT JOIN profile opr ON opr.account_id = op.account_id
     WHERE p.account_id = ? ORDER BY p.created_at DESC`,
    [req.user.id, req.user.id, user.id],
  );
  res.json({ posts: rows.map(serializePostRow) });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  if (req.user.role === "admin") {
    throw new ApiError(403, "Administrator accounts cannot follow people");
  }
  const target = await getUserByUsername(req.params.username);
  if (!target) throw new ApiError(404, "We couldn't find that person");
  if (target.role === "admin") {
    throw new ApiError(403, "Administrator accounts cannot be followed");
  }
  if (String(target.id) === String(req.user.id)) throw new ApiError(400, "You can't follow yourself");

  const [existing] = await pool.query(
    "SELECT follow_id FROM follow WHERE follower_id = ? AND following_id = ? LIMIT 1",
    [req.user.id, target.id],
  );
  if (existing.length) {
    await pool.query("DELETE FROM follow WHERE follow_id = ?", [existing[0].follow_id]);
  } else {
    await pool.query("INSERT INTO follow (follower_id, following_id) VALUES (?, ?)", [
      req.user.id,
      target.id,
    ]);
  }
  const updated = await getUserById(target.id);
  updated.isFollowing = !existing.length;
  res.json({ user: serializeUser(updated, req.user.id) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const relationshipStatuses = ["Single", "Married", "Prefer not to say"];
  if (
    req.body.relationshipStatus !== undefined &&
    !relationshipStatuses.includes(req.body.relationshipStatus)
  ) {
    throw new ApiError(400, "Choose a valid relationship status");
  }

  const allowed = {
    name: "display_name",
    bio: "bio",
    gender: "gender",
    birthday: "birthday",
    relationshipStatus: "relation_status",
    avatar: "profile_picture",
    cover: "background_picture",
    coverPosition: "background_position",
  };
  const changes = Object.entries(allowed)
    .filter(([key]) => req.body[key] !== undefined)
    .map(([key, column]) => [column, req.body[key]]);

  if (req.body.coverPosition !== undefined) {
    const position = /^(\d{1,3})%\s+(\d{1,3})%$/.exec(req.body.coverPosition);
    if (!position || position.slice(1).some((value) => Number(value) > 100)) {
      throw new ApiError(400, "Choose a valid cover photo position");
    }
  }

  if (changes.length) {
    const values = changes.map(([, value]) => value);
    const assignments = changes.map(([column]) => `\`${column}\` = ?`).join(", ");
    await pool.query(
      `INSERT INTO profile (account_id) VALUES (?) ON DUPLICATE KEY UPDATE account_id = account_id`,
      [req.user.id],
    );
    await pool.query(`UPDATE profile SET ${assignments} WHERE account_id = ?`, [
      ...values,
      req.user.id,
    ]);
  }
  const user = await getUserById(req.user.id);
  res.json({ user: serializeUser(user, req.user.id) });
});
