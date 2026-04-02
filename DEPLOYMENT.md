# Deploying Kaya POS to Vercel

Kaya POS can be deployed to Vercel as a serverless Node.js application. The frontend is served as static assets from Vercel's CDN, and all `/api/*` routes are handled by a serverless Express function.

## Prerequisites

- A PostgreSQL database accessible from the public internet (e.g., Neon, Supabase, Railway, or any cloud-hosted PostgreSQL)
- A Vercel account

> **Note on Replit's built-in PostgreSQL:** Replit's database is not publicly accessible, so you will need a separate cloud PostgreSQL provider for Vercel deployment. Set your `DATABASE_URL` to that provider's connection string.

---

## Environment Variables

Set the following environment variables in your Vercel project settings (**Settings → Environment Variables**):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Full PostgreSQL connection string (`postgresql://user:password@host:5432/db`) |
| `SESSION_SECRET` | Yes | A long, random string used to sign session cookies. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `NODE_ENV` | Yes | Set to `production` |
| `DB_POOL_MAX` | No | Max PostgreSQL connections per function instance (default: `2` on Vercel) |

---

## Deployment Steps

### 1. Push your code to GitHub

```bash
git add .
git commit -m "Configure Vercel deployment"
git push
```

### 2. Create a new Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect `vercel.json` at the project root

### 3. Set environment variables

In the Vercel dashboard:
1. Go to **Settings → Environment Variables**
2. Add `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV=production`
3. Apply to **Production**, **Preview**, and **Development** environments as appropriate

### 4. Initialize the database schema

Before the first deployment or after schema changes, run Drizzle's push command against your production database:

```bash
DATABASE_URL=<your-production-url> npm run db:push
```

### 5. Deploy

Vercel will automatically deploy on every push to your main branch. The build command is `npm run vercel-build` (which runs `vite build` to compile the frontend).

---

## How it Works

| Layer | Technology | Notes |
|---|---|---|
| Static assets | Vercel CDN | Built from `client/` by Vite → `dist/public/` |
| API routes | Vercel Serverless (Node.js) | `api/index.ts` wraps the Express app |
| Database | PostgreSQL (external) | Connected via `DATABASE_URL` |
| Sessions | PostgreSQL-backed (`connect-pg-simple`) | Stored in the `sessions` table |
| Offline sync | IndexedDB + `/api/sync/*` | Works after first authenticated load |

---

## Build Configuration (vercel.json)

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist/public",
  "functions": { "api/index.ts": { "maxDuration": 30 } },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.ts" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- **`outputDirectory`** — Vite's output is served directly from Vercel's CDN
- **`/api/:path*` rewrite** — All API calls go to the Express serverless function
- **`/(.*) → /index.html`** — Enables client-side routing for the React SPA

---

## Default Admin Account

The first time the app starts, it creates a default admin account:

- **Username:** `admin`
- **Password:** `admin123`

**Change this password immediately after first login.** The server logs a warning on every start until the default password is changed.

---

## Troubleshooting

**"SESSION_SECRET environment variable must be set in production"**
→ Add `SESSION_SECRET` to your Vercel environment variables.

**Database connection errors**
→ Ensure `DATABASE_URL` is set and your database accepts connections from Vercel's IP ranges (or is publicly accessible). Some providers require you to allow all IPs (`0.0.0.0/0`).

**Schema not found / table errors**
→ Run `DATABASE_URL=<your-url> npm run db:push` to initialize the schema.

**Too many connections error**
→ Set `DB_POOL_MAX=1` in Vercel environment variables, or use a database with a connection pooler (e.g., Neon's pooled connection URL, PgBouncer).
