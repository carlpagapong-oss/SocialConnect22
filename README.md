# SocialConnect

A small social network: React (Vite + Tailwind) front end and an Express + MongoDB API.

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

# 2. Client (new terminal)
cd app
npm install
npm run dev         # http://localhost:5173  (proxies /api to the server)
```

Before deploying, change `JWT_SECRET` in `server/.env` to a long random string.

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
