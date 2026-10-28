import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { serializePostRow } from "../utils/sql.js";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const POST_FIELDS = `
  p.post_id, p.account_id AS owner_id, p.original_post_id,
  p.content AS shared_content,
  CASE WHEN p.original_post_id IS NULL THEN p.account_id ELSE op.account_id END AS author_id,
  CASE WHEN p.original_post_id IS NULL THEN p.content ELSE op.content END AS content,
  CASE WHEN p.original_post_id IS NULL THEN p.image_path ELSE op.image_path END AS image_path,
  CASE WHEN p.original_post_id IS NULL THEN p.media_type ELSE op.media_type END AS media_type,
  p.created_at, p.updated_at,
  CASE WHEN p.original_post_id IS NULL THEN p.created_at ELSE op.created_at END AS original_created_at,
  CASE WHEN p.original_post_id IS NULL THEN a.username ELSE oa.username END AS author_username,
  CASE WHEN p.original_post_id IS NULL THEN pr.display_name ELSE opr.display_name END AS author_name,
  CASE WHEN p.original_post_id IS NULL THEN pr.profile_picture ELSE opr.profile_picture END AS author_avatar,
  CASE WHEN p.original_post_id IS NULL THEN NULL ELSE p.account_id END AS shared_by_id,
  CASE WHEN p.original_post_id IS NULL THEN NULL ELSE a.username END AS shared_by_username,
  CASE WHEN p.original_post_id IS NULL THEN NULL ELSE pr.display_name END AS shared_by_name,
  CASE WHEN p.original_post_id IS NULL THEN NULL ELSE pr.profile_picture END AS shared_by_avatar,
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
     LEFT JOIN post op ON op.post_id = p.original_post_id
     LEFT JOIN account oa ON oa.account_id = op.account_id
     LEFT JOIN profile opr ON opr.account_id = op.account_id
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
     LEFT JOIN post op ON op.post_id = p.original_post_id
     LEFT JOIN account oa ON oa.account_id = op.account_id
     LEFT JOIN profile opr ON opr.account_id = op.account_id
     ORDER BY p.created_at DESC LIMIT ?`,
    [req.user.id, req.user.id, limit],
  );
  res.json({ posts: rows.map(serializePostRow) });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await findPost(req.params.id, req.user.id);
  if (!post) throw new ApiError(404, "Post not found");
  const original = post.original_post_id
    ? await findPost(post.original_post_id, req.user.id)
    : post;
  res.json({ post: serializePostRow(original) });
});

export const createPost = asyncHandler(async (req, res) => {
  const { text, image, mediaType } = req.body;
  if ((!text || !text.trim()) && !image) {
    throw new ApiError(400, "Add a message, photo, or video before posting");
  }
  if (text.trim().length > 1000) throw new ApiError(400, "Posts must be 1000 characters or fewer");

  const [result] = await pool.query(
    "INSERT INTO post (account_id, content, image_path, media_type) VALUES (?, ?, ?, ?)",
    [req.user.id, text.trim(), image || null, mediaType || null],
  );
  const post = await findPost(result.insertId, req.user.id);
  res.status(201).json({ post: serializePostRow(post) });
});

export const sharePost = asyncHandler(async (req, res) => {
  const original = await findPost(req.params.id, req.user.id);
  if (!original) throw new ApiError(404, "Post not found");
  if (String(original.author_id) === String(req.user.id)) {
    throw new ApiError(400, "You cannot share your own post");
  }
  const originalPostId = original.original_post_id || req.params.id;
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (message.length > 1000) {
    throw new ApiError(400, "Your message must be 1000 characters or fewer");
  }
  const [result] = await pool.query(
    "INSERT INTO post (account_id, content, original_post_id) VALUES (?, ?, ?)",
    [req.user.id, message, originalPostId],
  );
  const shared = await findPost(result.insertId, req.user.id);
  res.status(201).json({ post: serializePostRow(shared) });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await findPost(req.params.id, req.user.id);
  if (!post) throw new ApiError(404, "Post not found");
  if (String(post.owner_id) !== String(req.user.id)) {
    throw new ApiError(403, "You can only edit your own post");
  }
  if (!post.original_post_id) {
    throw new ApiError(400, "Only a shared post caption can be edited here");
  }
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (message.length > 1000) {
    throw new ApiError(400, "Your message must be 1000 characters or fewer");
  }
  await pool.query("UPDATE post SET content = ? WHERE post_id = ?", [message, req.params.id]);
  const updated = await findPost(req.params.id, req.user.id);
  res.json({ post: serializePostRow(updated) });
});

export const updateSharedPost = asyncHandler(async (req, res) => {
  const post = await findPost(req.params.id, req.user.id);
  if (!post) throw new ApiError(404, "Shared post not found");
  if (String(post.owner_id) !== String(req.user.id)) {
    throw new ApiError(403, "You can only edit your own shared post");
  }
  if (!post.original_post_id) {
    throw new ApiError(400, "This post is not a shared post");
  }

  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (message.length > 1000) {
    throw new ApiError(400, "Your message must be 1000 characters or fewer");
  }

  await pool.query("UPDATE post SET content = ? WHERE post_id = ? AND account_id = ?", [
    message,
    req.params.id,
    req.user.id,
  ]);
  const updated = await findPost(req.params.id, req.user.id);
  res.json({
    post: {
      ...serializePostRow(updated),
      sharedText: message,
    },
  });
});

export const uploadPostMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Choose a photo or video to upload");
  const uploadsDir = path.resolve("uploads");
  await mkdir(uploadsDir, { recursive: true });
  const extension = path.extname(req.file.originalname).toLowerCase();
  const filename = `${randomUUID()}${extension}`;
  const destination = path.join(uploadsDir, filename);
  await import("node:fs/promises").then(({ writeFile }) => writeFile(destination, req.file.buffer));
  const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
  res.status(201).json({
    url: `${req.protocol}://${req.get("host")}/uploads/${filename}`,
    mediaType,
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await findPost(req.params.id, req.user.id);
  if (!post) throw new ApiError(404, "Post not found");
  if (String(post.owner_id) !== String(req.user.id)) {
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
     LEFT JOIN post op ON op.post_id = p.original_post_id
     LEFT JOIN account oa ON oa.account_id = op.account_id
     LEFT JOIN profile opr ON opr.account_id = op.account_id
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

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const [rows] = await pool.query(
    "SELECT comment_id, account_id FROM comment WHERE comment_id = ?",
    [commentId],
  );
  if (!rows.length) throw new ApiError(404, "Comment not found");
  if (String(rows[0].account_id) !== String(req.user.id)) {
    throw new ApiError(403, "You can only delete your own comments");
  }
  await pool.query("DELETE FROM comment WHERE comment_id = ?", [commentId]);
  res.json({ success: true });
});
