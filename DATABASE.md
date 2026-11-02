# SocialConnect MySQL Database Guide

This document explains the SocialConnect database structure and how to move it
to another MySQL or XAMPP installation.

## Database summary

The application uses a MySQL database named `social_connect`. The backend
connects using the values in `server/.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=social_connect
```

The default XAMPP configuration used by this project runs MySQL on port
`3307`. If your MySQL server uses the standard port, change `DB_PORT` to
`3306`.

The database stores:

- Account credentials, roles, status, and email addresses.
- User profiles and profile images.
- Posts and post media references.
- Shared posts.
- Followers and following relationships.
- Likes, comments, and bookmarks.

The database does **not** store uploaded files. Post media and profile images
are stored under the backend `server/uploads/` directory. The login and
password-reset OTP challenges are currently held in server memory for two
minutes and are not stored in MySQL.

## Fresh installation

For a new database, use the final schema export. It already contains all
columns, indexes, and foreign keys required by the current application.

### MySQL command line

From the project directory:

```powershell
mysql -u root -p -h 127.0.0.1 -P 3307 < server\social_connect_schema.sql
```

If your root account has no password, press Enter when prompted. On Windows,
the `mysql` command must be available in PATH, or run the `mysql.exe` file
from your MySQL or XAMPP installation.

### XAMPP phpMyAdmin

1. Start **MySQL** in the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin`.
3. Select the **Import** tab.
4. Choose `server/social_connect_schema.sql`.
5. Click **Import**.
6. Confirm that the `social_connect` database was created.

Do not run the migration files after importing the final schema. The migration
files describe changes that are already included in the schema export.

## Migrating an existing database

Before changing an existing database, create a backup:

```powershell
mysqldump -u root -p -h 127.0.0.1 -P 3307 social_connect > social_connect_backup.sql
```

To restore that backup:

```powershell
mysql -u root -p -h 127.0.0.1 -P 3307 social_connect < social_connect_backup.sql
```

If the existing database was created from an older version of the project,
apply the migration files in this order:

1. `server/migrations/20261020_add_account_roles.sql`
2. `server/migrations/20261020_add_post_media_type.sql`
3. `server/migrations/20261020_add_post_shares.sql`
4. `server/migrations/20261023_add_cover_position.sql`

Example:

```powershell
mysql -u root -p -h 127.0.0.1 -P 3307 social_connect `
  < server\migrations\20261020_add_account_roles.sql

mysql -u root -p -h 127.0.0.1 -P 3307 social_connect `
  < server\migrations\20261020_add_post_media_type.sql

mysql -u root -p -h 127.0.0.1 -P 3307 social_connect `
  < server\migrations\20261020_add_post_shares.sql

mysql -u root -p -h 127.0.0.1 -P 3307 social_connect `
  < server\migrations\20261023_add_cover_position.sql
```

Each migration should be applied only once. If a column or index already
exists, stop and inspect the database instead of rerunning the statement.

## Tables and relationships

### `account`

Stores the login identity for every user.

- Primary key: `account_id`
- Unique fields: `username`, `email`
- `password_hash` contains a bcrypt password hash, never a plain-text password.
- `role` is normally `user` or `admin`.
- `account_status` is normally `active` or `deactivated`.

### `profile`

Stores the profile belonging to an account.

- Primary key: `profile_id`
- One-to-one relationship with `account.account_id`
- Deleting an account deletes its profile.
- `profile_picture` and `background_picture` contain file paths, not image data.

### `post`

Stores posts and shared-post records.

- Primary key: `post_id`
- `account_id` identifies the author.
- `image_path` stores a media file path.
- `media_type` identifies the media type when present.
- `original_post_id` points to the original post for a shared post.
- Deleting the original post also deletes its shares.

### `follow`

Stores follower relationships.

- `follower_id` is the account doing the following.
- `following_id` is the account being followed.
- The pair is unique, so the same relationship cannot be inserted twice.

### `post_like`

Stores post likes.

- The `(account_id, post_id)` pair is unique.
- Deleting the account or post deletes its likes.

### `comment`

Stores comments on posts.

- `account_id` identifies the commenter.
- `post_id` identifies the post.
- Deleting the account or post deletes its comments.

### `bookmark`

Stores saved posts.

- The `(account_id, post_id)` pair is unique.
- Deleting the account or post deletes its bookmarks.

## Relationship diagram

```text
account
  1 ─── 1 profile
  1 ─── N post
  1 ─── N comment
  1 ─── N follow (follower)
  1 ─── N follow (following)
  1 ─── N post_like
  1 ─── N bookmark

post
  1 ─── N comment
  1 ─── N post_like
  1 ─── N bookmark
  1 ─── N post (shared posts)
```

## Verify the migration

Run these checks after importing or migrating:

```sql
USE social_connect;

SHOW TABLES;

DESCRIBE account;
DESCRIBE profile;
DESCRIBE post;
DESCRIBE follow;
DESCRIBE post_like;
DESCRIBE comment;
DESCRIBE bookmark;

SELECT COUNT(*) AS accounts FROM account;
SELECT COUNT(*) AS profiles FROM profile;
SELECT COUNT(*) AS posts FROM post;
```

Check that the current schema columns exist:

```sql
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'social_connect'
     AND table_name = 'account'
     AND column_name = 'role') AS has_account_role,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'social_connect'
     AND table_name = 'post'
     AND column_name = 'media_type') AS has_post_media_type,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'social_connect'
     AND table_name = 'post'
     AND column_name = 'original_post_id') AS has_post_shares,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'social_connect'
     AND table_name = 'profile'
     AND column_name = 'background_position') AS has_cover_position;
```

Each result should be `1`.

## Connect the backend

Copy the server environment template to `server/.env`, then set the database
values for the destination MySQL server:

```powershell
Copy-Item server\.env.example server\.env
```

Set a real `JWT_SECRET` before starting the API. Do not commit `server/.env`
or database passwords.

Start the backend:

```powershell
cd server
npm install
npm run dev
```

The API logs a successful connection to `social_connect` when the database is
available. The API uses the schema in `server/social_connect_schema.sql`; it
does not run migrations automatically.

## Moving the complete application

For a complete transfer, move both:

1. The MySQL database, using `mysqldump` or the schema/import process above.
2. The `server/uploads/` directory, because image and video files are not
   stored inside MySQL.

Then update `server/.env` on the new machine and restart the backend.
