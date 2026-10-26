# SocialConnect architecture inspection

Inspection basis: the checked-out `SocialConnect22` source, `server/social_connect_schema.sql`, and the four SQL migrations. No live MySQL connection or real user data was accessed.

## Current architecture

### Desktop application

- `app/` is a Vite React 19 application.
- `app/electron.cjs` is the Electron main process. It creates a browser window with `nodeIntegration: false` and `contextIsolation: true`, then loads `app/dist/index.html`.
- `app/src/main.jsx` selects `HashRouter` for `file:` URLs and `BrowserRouter` for normal HTTP URLs. `App.jsx` defines guest, protected, profile, post, bookmarks, people, and administrator routes.
- The React client calls the API through `app/src/services/api.js`. A bearer JWT is stored in `localStorage`; the packaged desktop app defaults to `http://localhost:5000/api`.
- Vite proxies `/api` to `http://localhost:5000` during development. The `base: "./"` setting supports the Electron file URL.

### Backend and database

- `server/` is an Express 4 API using `mysql2/promise`, `jsonwebtoken`, `bcryptjs`, `multer`, and `dotenv`.
- `server/server.js` serves `/api`, static `/uploads`, CORS, JSON parsing, and error handling.
- `server/config/db.js` connects to the XAMPP/MySQL database using environment variables. The checked-in example uses database `social_connect` and port `3307`; the runtime default is port `3306`.
- JWT authentication is implemented in `server/middleware/auth.js`. Role authorization currently protects administrator account management.
- Uploaded post media is written to the backend's local `server/uploads/` directory and exposed through `/uploads`.

## Existing user-visible behavior

| Area | Evidence in source |
| --- | --- |
| Registration and login | `authRoutes.js`, `authController.js`, `LoginPage.jsx`, `SignupPage.jsx` |
| Session restoration and logout | `AuthContext.jsx`, `/api/auth/me` |
| Feed and individual posts | `HomePage.jsx`, `PostPage.jsx`, `postController.js` |
| Create, edit shared captions, and delete owned posts | `postController.js`, `postService.js` |
| Image/video upload | `multer` upload route and local `uploads/` directory |
| Likes and bookmarks | `post_like`, `bookmark`, and toggle endpoints |
| Comments | `comment` table and post comment endpoints |
| Reposts/shares | `post.original_post_id` self-reference and share endpoints |
| Profiles and profile editing | `profile`, `ProfilePage.jsx`, `UserProfilePage.jsx` |
| Following and people directory/search | `follow`, `PeoplePage.jsx`, `AppShell.jsx` |
| Administrator account activation/deactivation | `AdminPage.jsx`, `requireRole("admin")` |

The source does not show a forgot-password flow. It is not included in the proposed web scope.

## Current database model

The schema contains seven tables: `account`, `profile`, `post`, `follow`, `post_like`, `comment`, and `bookmark`. The current MySQL ERD is in [socialconnect-mysql-erd.md](./socialconnect-mysql-erd.md).

The SQL export is schema-only and contains no rows. The migration files are already reflected in the exported schema: `role`, `media_type`, `original_post_id`, and `background_position` are present.

## Electron-specific versus browser-compatible behavior

Electron-specific behavior is limited to the main process window creation and the file-URL router selection. The React pages, services, and API contract do not require Node or Electron APIs. The local MySQL connection, JWT API, and local filesystem media storage are backend concerns and cannot be called directly from an untrusted browser.

For a web deployment, the browser client should use Supabase Auth and the Supabase client with only the publishable/anon key. Database writes must be protected by RLS; service-role credentials must remain server-side. Media should move from the local filesystem to Supabase Storage or another managed private/public media service.

## Proposed changes for a later implementation phase

1. Add a separate `web/` Vite React application without moving `app/` or `server/`.
2. Reuse presentation components selectively; replace the JWT API service with a Supabase service layer.
3. Add an `auth_user_id` mapping from the existing application account to `auth.users.id`.
4. Apply the reviewed PostgreSQL schema and RLS policies in Supabase.
5. Replace local uploads with a reviewed Storage bucket and policies.
6. Add browser deployment configuration and environment variables only after the web implementation is tested.

These steps are not performed by this inspection. In particular, no Supabase project, database, migration, deployment, or public URL has been created.

## Verification status

- Source and SQL inspection: completed.
- ERD and PostgreSQL schema generation: completed as review artifacts.
- Desktop runtime test: not run during inspection.
- Web runtime, Supabase connection, RLS, data migration, and deployment: not applicable yet; no web app or Supabase project exists.
