import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getUserById, getUserByUsername, serializeUser } from "../utils/sql.js";

export const getSuggestions = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.account_id AS id, a.username, a.email, a.created_at AS account_created_at,
            p.display_name AS name, p.profile_picture AS avatar, p.background_picture AS cover,
            p.bio, p.gender, p.birthday, p.relation_status AS relationshipStatus,
            (SELECT COUNT(*) FROM follow f WHERE f.following_id = a.account_id) AS followersCount,
            (SELECT COUNT(*) FROM follow f WHERE f.follower_id = a.account_id) AS followingCount,
            EXISTS(SELECT 1 FROM follow f WHERE f.follower_id = ? AND f.following_id = a.account_id) AS isFollowing
     FROM account a LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE a.account_id <> ?
       AND NOT EXISTS (
         SELECT 1 FROM follow f WHERE f.follower_id = ? AND f.following_id = a.account_id
       )
     ORDER BY a.created_at DESC LIMIT 5`,
    [req.user.id, req.user.id, req.user.id],
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
    `SELECT p.post_id, p.account_id AS author_id, p.content, p.image_path, p.created_at, p.updated_at,
            a.username AS author_username, pr.display_name AS author_name, pr.profile_picture AS author_avatar,
            (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = p.post_id) AS likes_count,
            (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.post_id) AS comment_count,
            EXISTS(SELECT 1 FROM post_like pl WHERE pl.post_id = p.post_id AND pl.account_id = ?) AS liked,
            EXISTS(SELECT 1 FROM bookmark b WHERE b.post_id = p.post_id AND b.account_id = ?) AS bookmarked
     FROM post p JOIN account a ON a.account_id = p.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     WHERE p.account_id = ? ORDER BY p.created_at DESC`,
    [req.user.id, req.user.id, user.id],
  );
  res.json({
    posts: rows.map((row) => ({
      id: String(row.post_id),
      text: row.content,
      image: row.image_path || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: String(row.author_id),
        name: row.author_name || row.author_username,
        username: row.author_username,
        avatar: row.author_avatar || "",
      },
      likesCount: Number(row.likes_count || 0),
      liked: Boolean(row.liked),
      bookmarked: Boolean(row.bookmarked),
      commentCount: Number(row.comment_count || 0),
    })),
  });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const target = await getUserByUsername(req.params.username);
  if (!target) throw new ApiError(404, "We couldn't find that person");
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
  const allowed = {
    name: "display_name",
    bio: "bio",
    gender: "gender",
    birthday: "birthday",
    relationshipStatus: "relation_status",
    avatar: "profile_picture",
    cover: "background_picture",
  };
  const changes = Object.entries(allowed)
    .filter(([key]) => req.body[key] !== undefined)
    .map(([key, column]) => [column, req.body[key]]);

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
