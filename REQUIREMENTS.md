# SocialConnect Transfer Requirements

This document lists the software, packages, configuration, and deployment
steps required to run SocialConnect on another computer or host.

## 1. Required software

Install the following on the destination machine:

- **Node.js 20 LTS or newer**
- **npm 10 or newer** (included with Node.js)
- **MySQL 8 or newer**, or XAMPP with MySQL/MariaDB enabled
- **Git** (optional, only needed when cloning the project)

The backend uses MySQL. SQLite, PostgreSQL, and MongoDB are not supported by
the current application.

## 2. Project structure

The project has two independent Node.js applications:

```text
SocialConnect22/
├── app/       # React/Vite frontend and Electron desktop shell
├── server/    # Express API and MySQL backend
└── server/
    └── social_connect_schema.sql
```

Install dependencies separately in both directories:

```powershell
cd app
npm install

cd ..\server
npm install
```

The exact package versions are recorded in each `package-lock.json`. Keep
those lock files when transferring the project. For a reproducible install,
use `npm ci` instead of `npm install` after copying the lock files.

## Frameworks and technology stack

### Frontend

- **React 19** - component-based user interface framework.
- **Vite 6** - frontend development server and production build tool.
- **React Router 6** - client-side routing.
- **Tailwind CSS 4** - utility-first CSS framework.
- **Electron 44** - optional desktop application shell.

The frontend is written in JavaScript/JSX. It uses `BrowserRouter` in a normal
web browser and `HashRouter` when running from an Electron `file:` URL.

### Backend

- **Node.js** - JavaScript runtime.
- **Express 4** - HTTP server and REST API framework.
- **MySQL 8+** - relational database.
- **mysql2** - Node.js MySQL driver.
- **JWT (`jsonwebtoken`)** - API authentication tokens.
- **bcryptjs** - password hashing.
- **Multer** - uploaded image and video handling.

### Supporting frontend libraries

These are installed automatically by `npm install` or `npm ci`; they do not
need separate global installation:

- Radix UI components
- React Hook Form and Zod
- Recharts
- Lucide React
- Sonner
- date-fns
- class-variance-authority, clsx, and tailwind-merge

### Build and development tools

- `@vitejs/plugin-react` - React support for Vite.
- `@tailwindcss/vite` - Tailwind CSS integration for Vite.
- Prettier - frontend formatting.
- Node watch mode - backend development reload through `npm run dev`.

## 3. Database setup

Create the database from the schema export:

```powershell
mysql -u root -p -h 127.0.0.1 -P 3307 < server\social_connect_schema.sql
```

Use port `3306` instead if the destination MySQL installation uses the
standard port.

The schema creates the `social_connect` database and these tables:

- `account`
- `profile`
- `post`
- `follow`
- `post_like`
- `comment`
- `bookmark`

For an existing installation, back up the database before importing or
migrating it:

```powershell
mysqldump -u root -p -h 127.0.0.1 -P 3307 social_connect > social_connect_backup.sql
```

To move existing application data, transfer both:

1. A MySQL dump of the `social_connect` database.
2. The `server\uploads\` directory, which contains uploaded post media.

Uploaded images and videos are not stored inside MySQL.

## 4. Backend environment configuration

Copy the environment template:

```powershell
Copy-Item server\.env.example server\.env
```

Update `server\.env` for the destination host:

```dotenv
NODE_ENV=production
PORT=5001
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=social_connect
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Important:

- Set a unique, long `JWT_SECRET`.
- Do not commit `server\.env`.
- Use the public frontend URL for `CLIENT_URL` in production.
- Use the actual database port, commonly `3306` or `3307`.
- If the database password is empty, set `DB_PASSWORD=` with no value.

## 5. Run locally

Start the backend:

```powershell
cd server
npm run dev
```

The API runs on `http://localhost:5001` by default.

In a second terminal, start the frontend:

```powershell
cd app
npm run dev
```

The Vite frontend runs on `http://localhost:5173` by default and proxies API
requests to the backend.

## 6. Production deployment

### Build the frontend

```powershell
cd app
npm ci
npm run build
```

The production frontend files are generated in `app\dist\`.

### Start the backend

```powershell
cd server
npm ci
set NODE_ENV=production
npm start
```

Use the hosting provider's environment-variable settings instead of a
committed `.env` file. Run the backend behind HTTPS and configure the reverse
proxy or hosting platform to forward API requests to port `5001`.

The frontend must be configured to call the deployed API URL. The current
development configuration uses the Vite `/api` proxy; production hosting
must provide an equivalent reverse proxy or a production API base URL.

### Recommended production checklist

- Use a managed MySQL database or a secured MySQL server.
- Create a non-root MySQL user with only the permissions required by the app.
- Set a strong `JWT_SECRET`.
- Enable HTTPS.
- Set `CLIENT_URL` to the exact frontend origin.
- Persist and back up `server\uploads\`.
- Configure a process manager or hosting service to restart the Node server.
- Do not expose MySQL directly to the public internet.

## 7. Optional Electron desktop build

The `app` package also contains an Electron shell:

```powershell
cd app
npm ci
npm run desktop
```

This builds the Vite frontend and launches the Electron application. The
Electron app still requires a reachable running backend and MySQL database.

## 8. Useful npm commands

| Location | Command | Purpose |
| --- | --- | --- |
| `app` | `npm run dev` | Start the frontend development server |
| `app` | `npm run build` | Create the production frontend build |
| `app` | `npm run preview` | Preview the production frontend build |
| `app` | `npm run desktop` | Build and launch the Electron desktop app |
| `app` | `npm run format` | Format frontend files with Prettier |
| `server` | `npm run dev` | Start the backend with Node watch mode |
| `server` | `npm start` | Start the backend normally |
| `server` | `npm run create-admin` | Create an administrator account |
