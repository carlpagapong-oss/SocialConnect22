import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { serializePostRow } from "../utils/sql.js";

const POST_FIELDS = `
  p.post_id, p.account_id AS author_id, p.content, p.image_path, p.created_at, p.updated_at,
  a.username AS author_username, pr.display_name AS author_name, pr.profile_picture AS author_avatar,
  (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id = p.post_id) AS likes_count,
  (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.post_id) AS comment_count,
  EXISTS(SELECT 1 FROM post_like vpl WHERE vpl.post_id = p.post_id AND vpl.account_id = ?) AS liked,
  EXISTS(SELECT 1 FROM bookmark b WHERE b.post_id = p.post_id AND b.account_id = ?) AS bookmarked
`;

async function findPost(id, viewerId) {
  const [rows] = await pool.query(
    `SELECT ${POST_FIELDS} FROM post p
     JOIN account a ON a.account_id = p.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     WHERE p.post_id = ? LIMIT 1`,
    [viewerId, viewerId, id],
  );
  return rows[0] || null;
}

export const getFeed = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const [rows] = await pool.query(
    `SELECT ${POST_FIELDS} FROM post p
     JOIN account a ON a.account_id = p.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     ORDER BY p.created_at DESC LIMIT ?`,
    [req.user.id, req.user.id, limit],
  );
  res.json({ posts: rows.map(serializePostRow) });
});

export const createPost = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, "Write something to share");
  if (text.trim().length > 1000) throw new ApiError(400, "Posts must be 1000 characters or fewer");

  const [result] = await pool.query(
    "INSERT INTO post (account_id, content, image_path) VALUES (?, ?, ?)",
    [req.user.id, text.trim(), image || null],
  );
  const post = await findPost(result.insertId, req.user.id);
  res.status(201).json({ post: serializePostRow(post) });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await findPost(req.params.id, req.user.id);
  if (!post) throw new ApiError(404, "Post not found");
  if (String(post.author_id) !== String(req.user.id)) {
    throw new ApiError(403, "You can only delete your own posts");
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM comment WHERE post_id = ?", [req.params.id]);
    await connection.query("DELETE FROM post_like WHERE post_id = ?", [req.params.id]);
    await connection.query("DELETE FROM bookmark WHERE post_id = ?", [req.params.id]);
    await connection.query("DELETE FROM post WHERE post_id = ?", [req.params.id]);
    await connection.commit();
    res.json({ message: "Post deleted" });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export const toggleLike = asyncHandler(async (req, res) => {
  if (!(await findPost(req.params.id, req.user.id))) throw new ApiError(404, "Post not found");
  const [existing] = await pool.query(
    "SELECT like_id FROM post_like WHERE account_id = ? AND post_id = ? LIMIT 1",
    [req.user.id, req.params.id],
  );
  if (existing.length) {
    await pool.query("DELETE FROM post_like WHERE like_id = ?", [existing[0].like_id]);
  } else {
    await pool.query("INSERT INTO post_like (account_id, post_id) VALUES (?, ?)", [
      req.user.id,
      req.params.id,
    ]);
  }
  const [count] = await pool.query("SELECT COUNT(*) AS count FROM post_like WHERE post_id = ?", [
    req.params.id,
  ]);
  res.json({ liked: !existing.length, likesCount: Number(count[0].count) });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  if (!(await findPost(req.params.id, req.user.id))) throw new ApiError(404, "Post not found");
  const [existing] = await pool.query(
    "SELECT bookmark_id FROM bookmark WHERE account_id = ? AND post_id = ? LIMIT 1",
    [req.user.id, req.params.id],
  );
  if (existing.length) {
    await pool.query("DELETE FROM bookmark WHERE bookmark_id = ?", [existing[0].bookmark_id]);
  } else {
    await pool.query("INSERT INTO bookmark (account_id, post_id) VALUES (?, ?)", [
      req.user.id,
      req.params.id,
    ]);
  }
  res.json({ bookmarked: !existing.length });
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${POST_FIELDS} FROM post p
     JOIN account a ON a.account_id = p.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     JOIN bookmark b ON b.post_id = p.post_id AND b.account_id = ?
     ORDER BY b.created_at DESC`,
    [req.user.id, req.user.id, req.user.id],
  );
  res.json({ posts: rows.map(serializePostRow) });
});

export const getComments = asyncHandler(async (req, res) => {
  if (!(await findPost(req.params.id, req.user.id))) throw new ApiError(404, "Post not found");
  const [rows] = await pool.query(
    `SELECT c.comment_id AS id, c.comment_text AS text, c.created_at AS createdAt,
            a.account_id AS author_id, a.username AS author_username,
            pr.display_name AS author_name, pr.profile_picture AS author_avatar
     FROM comment c JOIN account a ON a.account_id = c.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    [req.params.id],
  );
  res.json({
    comments: rows.map((row) => ({
      id: String(row.id),
      text: row.text,
      createdAt: row.createdAt,
      author: {
        id: String(row.author_id),
        name: row.author_name || row.author_username,
        username: row.author_username,
        avatar: row.author_avatar || "",
      },
    })),
  });
});

export const addComment = asyncHandler(async (req, res) => {
  if (!(await findPost(req.params.id, req.user.id))) throw new ApiError(404, "Post not found");
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, "Write a comment first");
  if (text.trim().length > 500) throw new ApiError(400, "Comments must be 500 characters or fewer");

  const [result] = await pool.query(
    "INSERT INTO comment (account_id, post_id, comment_text) VALUES (?, ?, ?)",
    [req.user.id, req.params.id, text.trim()],
  );
  const [rows] = await pool.query(
    `SELECT c.comment_id AS id, c.comment_text AS text, c.created_at AS createdAt,
            a.account_id AS author_id, a.username AS author_username,
            pr.display_name AS author_name, pr.profile_picture AS author_avatar
     FROM comment c JOIN account a ON a.account_id = c.account_id
     LEFT JOIN profile pr ON pr.account_id = a.account_id
     WHERE c.comment_id = ?`,
    [result.insertId],
  );
  const row = rows[0];
  res.status(201).json({
    comment: {
      id: String(row.id),
      text: row.text,
      createdAt: row.createdAt,
      author: {
        id: String(row.author_id),
        name: row.author_name || row.author_username,
        username: row.author_username,
        avatar: row.author_avatar || "",
      },
    },
  });
});
