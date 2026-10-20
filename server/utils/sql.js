import { pool } from "../config/db.js";

export const USER_FIELDS = `
  a.account_id AS id,
  a.username,
  a.email,
  a.role,
  a.account_status,
  a.created_at AS account_created_at,
  p.display_name AS name,
  p.profile_picture AS avatar,
  p.background_picture AS cover,
  p.bio,
  p.age,
  p.birthday,
  p.relation_status AS relationshipStatus,
  p.gender,
  (SELECT COUNT(*) FROM follow f WHERE f.following_id = a.account_id) AS followersCount,
  (SELECT COUNT(*) FROM follow f WHERE f.follower_id = a.account_id) AS followingCount
`;

export async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS} FROM account a
     LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE a.account_id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function getUserByUsername(username) {
  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS}, a.password_hash
     FROM account a
     LEFT JOIN profile p ON p.account_id = a.account_id
     WHERE LOWER(a.username) = LOWER(?) LIMIT 1`,
    [username],
  );
  return rows[0] || null;
}

export function serializeUser(user, viewerId) {
  return {
    id: String(user.id),
    name: user.name || user.username,
    username: user.username,
    email: user.email,
    role: user.role || "user",
    bio: user.bio || "",
    gender: user.gender || "Prefer not to say",
    birthday: user.birthday,
    relationshipStatus: user.relationshipStatus || "",
    avatar: user.avatar || "",
    cover: user.cover || "",
    followersCount: Number(user.followersCount || 0),
    followingCount: Number(user.followingCount || 0),
    isFollowing: Boolean(user.isFollowing),
    createdAt: user.account_created_at,
    viewerId: viewerId ? String(viewerId) : undefined,
  };
}

export function serializeAuthor(row) {
  return {
    id: String(row.author_id),
    name: row.author_name || row.author_username,
    username: row.author_username,
    avatar: row.author_avatar || "",
  };
}

export function serializePostRow(row) {
  return {
    id: String(row.post_id),
    ownerId: String(row.owner_id || row.author_id),
    text: row.content,
    image: row.image_path || "",
    mediaType: row.media_type || (row.image_path ? "image" : ""),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: serializeAuthor(row),
    sharedBy: row.shared_by_id
      ? {
          id: String(row.shared_by_id),
          name: row.shared_by_name || row.shared_by_username,
          username: row.shared_by_username,
          avatar: row.shared_by_avatar || "",
        }
      : null,
    likesCount: Number(row.likes_count || 0),
    liked: Boolean(row.liked),
    bookmarked: Boolean(row.bookmarked),
    commentCount: Number(row.comment_count || 0),
  };
}
