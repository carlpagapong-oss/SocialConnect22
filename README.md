# SocialConnect

SocialConnect is a small social network application with:

- A React 19 and Vite frontend.
- An optional Electron desktop shell for the frontend.
- An Express REST API.
- A MySQL database, tested with the XAMPP setup used by this project.
- Local backend storage for uploaded post images and videos.

The existing desktop application and backend remain the source implementation.
The browser/Supabase version is maintained separately in the sibling
`SocialConnectWeb` folder.

## Project structure

```text
SocialConnect22/
├── app/                         React/Vite frontend and Electron client
│   ├── public/                  Static files and images
│   ├── src/
│   │   ├── components/          Shared, layout, post, profile, and UI components
│   │   ├── contexts/            Authentication context
│   │   ├── hooks/               Authentication, posts, mobile, and page-title hooks
│   │   ├── pages/               Login, signup, feed, profile, people, bookmarks, admin
│   │   ├── services/            REST API, auth, post, and user services
│   │   ├── App.jsx              Application routes
│   │   └── main.jsx             React entry point
│   ├── electron.cjs             Electron main process
│   ├── vite.config.js           Vite configuration and API proxy
│   └── package.json             Frontend, Vite, and Electron scripts
├── server/                      Express REST API
│   ├── config/                  Environment and MySQL connection
│   ├── controllers/             Authentication, posts, users, and admin logic
│   ├── middleware/              JWT authentication and error handling
│   ├── routes/                  API route definitions
│   ├── utils/                   SQL queries, serializers, and helpers
│   ├── migrations/              MySQL schema migrations
│   ├── uploads/                 Local uploaded media files
│   ├── social_connect_schema.sql MySQL schema-only export
│   └── server.js                Express entry point
├── docs/                        Inspection and MySQL ERD documentation
└── README.md

SocialConnectWeb/                 Separate browser/Supabase project
├── src/                          React application
├── public/                       Static files
├── supabase/                     PostgreSQL schema and policy SQL
├── package.json                  Vite web scripts
├── vite.config.js                Vite configuration
└── vercel.json                   Browser-route rewrites
```

## Current features

The implemented application currently supports:

- Account registration and login using username or email.
- JWT-based session restoration and logout.
- Profile viewing and profile editing.
- Profile and cover images.
- Newsfeed and individual post pages.
- Text posts and image/video post media.
- Post sharing/reposting with an optional caption.
- Editing and deleting posts owned by the current account.
- Likes and like counts.
- Comments.
- Following and unfollowing accounts.
- People directory, suggestions, and people search.
- Bookmarks.
- Administrator account activation and deactivation.

The current source does not implement a forgot-password flow.

## Database

The current backend uses MySQL through `mysql2/promise`. It does not use MongoDB.

The schema contains these tables:

- `account` — login identity, email, role, status, and creation time.
- `profile` — display name, biography, birthday, gender, relationship status, and images.
- `post` — authored posts, media references, timestamps, and shared-post links.
- `follow` — follower/following relationships.
- `post_like` — account/post likes.
- `comment` — comments written on posts.
- `bookmark` — saved account/post relationships.

The schema and relationships are documented in:

- [MySQL database schema](server/social_connect_schema.sql)
- [Current MySQL ERD](docs/socialconnect-mysql-erd.md)
- [Supabase ERD proposal](../SocialConnectWeb/docs/socialconnect-supabase-erd.md)
- [MySQL-to-Supabase mapping](../SocialConnectWeb/docs/mysql-to-supabase-mapping.md)
- [Proposed Supabase schema](../SocialConnectWeb/supabase/schema.sql)

The original MySQL database must remain intact while the Supabase version is
reviewed and developed. No data migration is included in the current project.

## Requirements

- Node.js 18 or newer.
- MySQL or XAMPP with the `social_connect` database.
- For the current XAMPP setup, MySQL uses port `3307`.

## Environment configuration

Create `server/.env` based on [server/.env.example](server/.env.example):

```dotenv
NODE_ENV=development
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=social_connect
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

The API refuses to start without `JWT_SECRET`. Do not commit `server/.env` or
real credentials.

The frontend normally uses the Vite proxy and therefore does not need an API
variable during local development. To use a separately hosted API, create
`app/.env` based on [app/.env.example](app/.env.example):

```dotenv
VITE_API_URL=https://your-api-host.example/api
```

## Database setup

Create the database and apply the schema from:

```text
server/social_connect_schema.sql
```

For an existing installation, apply each migration in
`server/migrations/` once, in filename order. The migrations add:

- Administrator roles and account status indexing.
- Post media type.
- Shared/reposted post references.
- Profile cover-image positioning.

The schema export already includes those migrated columns and constraints.

## Run the API and browser frontend

Install dependencies and start the API:

```powershell
cd server
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

In a second terminal, start the React frontend:

```powershell
cd app
npm install
npm run dev
```

The browser frontend runs at `http://localhost:5173` and proxies `/api` to the
Express server.

The API route groups are:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in with username or email |
| GET | `/api/auth/me` | Return the current authenticated account |
| GET / POST | `/api/posts` | Read the feed or create a post |
| GET | `/api/posts/:id` | Read one post |
| DELETE | `/api/posts/:id` | Delete an owned post |
| POST | `/api/posts/upload` | Upload post image/video media |
| POST | `/api/posts/:id/share` | Share a post |
| PUT | `/api/posts/:id/share` | Edit a shared-post caption |
| POST | `/api/posts/:id/like` | Toggle a like |
| POST | `/api/posts/:id/bookmark` | Toggle a bookmark |
| GET | `/api/posts/bookmarks` | Read bookmarked posts |
| GET / POST | `/api/posts/:id/comments` | Read or add comments |
| GET | `/api/users/suggestions` | Read account suggestions |
| GET | `/api/users/directory` | Read the people directory |
| GET | `/api/users/:username` | Read a profile |
| GET | `/api/users/:username/posts` | Read a user's posts |
| POST | `/api/users/:username/follow` | Toggle following |
| PUT | `/api/users/me` | Update the current profile |
| GET | `/api/users/admin/accounts` | Admin: list accounts |
| PUT | `/api/users/admin/accounts/:id/status` | Admin: activate/deactivate an account |

## Run the Electron desktop client

Start the API first, then run:

```powershell
cd app
npm install
npm run desktop
```

The `desktop` script builds the Vite frontend and opens the build in Electron.
Electron uses hash-based routing for the local `file:` URL. The packaged
frontend calls `http://localhost:5000/api` unless `VITE_API_URL` is configured.

The Electron window disables Node integration and enables context isolation.
The React frontend therefore communicates with the Express API rather than
accessing MySQL directly.

## Administrator accounts

New registrations receive the `user` role. To create an administrator, use:

```powershell
cd server
npm run create-admin -- --username admin --email admin@example.com --password ChangeMe123 --name Administrator --birthday 1990-01-01
```

Use a strong password instead of the example value.

Alternatively, promote an existing account directly in MySQL:

```sql
UPDATE account
SET role = 'admin'
WHERE username = 'your-admin-username';
```

Administrator authorization is enforced by the API with the `admin` role; hiding
the administrator link in the frontend is not the security control.

## Future Supabase web version

The sibling `SocialConnectWeb` directory contains the browser deployment:

- PostgreSQL translations of the current MySQL tables.
- A bridge from `account` to Supabase `auth.users`.
- Proposed RLS policies.
- Documentation for a controlled data migration.

It is not yet a runnable web application, and the Supabase schema has not been
executed against a Supabase project. Do not import real user data or expose
service-role credentials without explicit approval.

The confirmed Supabase project configuration for the future web client is:

```dotenv
VITE_SUPABASE_URL=https://ozugzkhfhwkiipiqhzvv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<set locally; do not commit>
```

Copy `SocialConnectWeb/.env.example` to `SocialConnectWeb/.env.local` before
running the web client.
The `.env.local` file is ignored by Git. Email confirmation remains enabled in
the Supabase project. The web client is now scaffolded and uses Supabase Auth/database calls. Before
running it, execute `SocialConnectWeb/supabase/20261025_auth_registration_trigger.sql` in
the Supabase SQL Editor if the base schema was already applied. This trigger is
required because email confirmation is enabled. The web client still needs the
remaining action policies and Storage bucket policies tested before public
deployment; no MySQL data was migrated.

For the requested school-demo registration behavior, turn off email
confirmation in Supabase Dashboard → Authentication → Providers → Email before
testing registration. The client keeps the session returned by Supabase Auth;
when confirmation is enabled, Supabase intentionally returns no active session
until the email is confirmed.

Supabase still requires an email-shaped login identifier, even when confirmation
is disabled. For demo accounts, use addresses such as
`friend-one@example.com`; no message is sent when email confirmation is off.
Usernames and display names can be arbitrary values subject to the application
validation.

After the trigger, execute
`SocialConnectWeb/supabase/20261025_web_rls_storage.sql`. It configures the seven-table RLS
policies, the `social-media` Storage bucket, and account-folder upload
permissions. These SQL files must be run in the Supabase SQL Editor; this
repository cannot verify live RLS or Storage behavior without a test project.

## Vercel deployment

For Vercel, select the separate `SocialConnectWeb` folder as the project
directory. Its equivalent Vercel settings are:

```text
Project folder: SocialConnectWeb
Framework preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Add these Vercel environment variables for the Production, Preview, and
Development environments:

```text
VITE_SUPABASE_URL=https://ozugzkhfhwkiipiqhzvv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
```

Only the publishable/anon key belongs in these browser variables. Never add a
Supabase service-role key, database password, JWT secret, or MySQL credentials.
`SocialConnectWeb/vercel.json` rewrites browser routes to `index.html`, so refreshing routes
such as `/home`, `/profile`, and `/user/name` works on Vercel.

After Vercel gives you a deployment URL, configure Supabase Dashboard →
Authentication → URL Configuration:

```text
Site URL: https://your-project.vercel.app
Redirect URLs: https://your-project.vercel.app/**
```

For this school-demo flow, disable Authentication → Providers → Email →
Confirm email. Supabase still requires an email-shaped identifier, but no
confirmation message is sent while confirmation is disabled.

This repository does not contain Vercel credentials and no deployment has been
performed from this environment. The deployed URL must not be reported until
Vercel confirms a successful deployment.
