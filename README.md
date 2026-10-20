# SocialConnect

A small social network: React (Vite + Tailwind) front end and an Express + MySQL API.

```
SocialConnect/
├── app/                    React client
│   ├── public/             favicon, robots.txt, images/ (static files)
│   └── src/
│       ├── assets/         images imported by components
│       ├── components/     ui/ (shadcn), common/, layout/, post/, profile/
│       ├── contexts/       AuthContext
│       ├── hooks/          useAuth, usePosts, usePageTitle, use-mobile
│       ├── pages/          Login, Signup, Home, Profile, UserProfile, Bookmarks, NotFound
│       ├── services/       api.js + auth / post / user service modules
│       ├── utils/          cn, constants, formatters
│       ├── App.jsx         routes
│       └── main.jsx        entry point
└── server/                 Express API
    ├── config/             env + database connection
    ├── controllers/        auth, post, user logic
    ├── middleware/         auth (JWT), error handling
    ├── models/             User, Post, Comment
    ├── routes/             /api/auth, /api/posts, /api/users
    ├── utils/              helpers + seed script
    ├── .env
    └── server.js
```

## Run it

You need Node 18+ and a running MongoDB (local, or an Atlas URI in `server/.env`).

```bash
# 1. API
cd server
npm install
npm run seed        # optional demo data: log in with maya@example.com / password123
npm run dev         # http://localhost:5000

# 2. Client in the browser (new terminal)
cd app
npm install
npm run dev         # http://localhost:5173  (proxies /api to the server)
```

### Run the React client as an Electron desktop application

The desktop client loads the production React build inside Electron. Start the
API first, then run:

```bash
cd app
npm install
npm run desktop
```

The packaged client calls `http://localhost:5000/api` by default. Set
`VITE_API_URL` before building if the API uses another address. Electron uses
hash-based routing for the local build, while browser development keeps normal
URLs.

Before deploying, change `JWT_SECRET` in `server/.env` to a long random string.
For the XAMPP setup described below, use MySQL port `3307` in `server/.env`.

### Admin account management

Run `server/migrations/20261020_add_account_roles.sql` once against the
`social_connect` database. New registrations always receive the `user` role.
They cannot create an Admin account from the signup page. Create the
pre-created Admin account from the server terminal:

```bash
cd server
npm run create-admin -- --username admin --email admin@example.com --password ChangeMe123 --name Administrator --birthday 1990-01-01
```

Use your own strong password instead of `ChangeMe123`. The command stores only
the bcrypt password hash. If you prefer to promote an existing account, run:

```sql
UPDATE account SET role = 'admin' WHERE username = 'your-admin-username';
```

When that pre-created account logs in through the same login page, it is
automatically sent to `/admin/accounts`. Regular users are sent to `/home`.
The Admin page can activate or deactivate existing accounts. The API enforces
the `admin` role, so hiding the link is not the security control.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | log in with username or email |
| GET | `/api/auth/me` | current user |
| GET / POST | `/api/posts` | feed / create post |
| DELETE | `/api/posts/:id` | delete own post |
| POST | `/api/posts/:id/like` | toggle like |
| POST | `/api/posts/:id/bookmark` | toggle bookmark |
| GET | `/api/posts/bookmarks` | saved posts |
| GET / POST | `/api/posts/:id/comments` | list / add comments |
| GET | `/api/users/suggestions` | people to follow |
| GET | `/api/users/:username` | profile |
| GET | `/api/users/:username/posts` | a person's posts |
| POST | `/api/users/:username/follow` | toggle follow |
| PUT | `/api/users/me` | update own profile |
| GET | `/api/users/admin/accounts` | Admin: list accounts |
| PUT | `/api/users/admin/accounts/:id/status` | Admin: activate or deactivate an account |
