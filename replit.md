# Kaya POS

A modern, offline-first Point of Sale (POS) application designed for small to medium-sized businesses (pharmacies, salons, restaurants, retail shops). Built as a Progressive Web App (PWA) with automatic background sync to a central PostgreSQL database.

## Tech Stack

- **Frontend:** React 19, TailwindCSS v4, shadcn/ui, Zustand, TanStack React Query, Dexie.js (IndexedDB), Wouter
- **Backend:** Express 5 (Node.js)
- **Auth:** Passport.js (Local Strategy), bcryptjs, express-session
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (central sync) + IndexedDB (offline-first client storage)
- **Build Tool:** Vite
- **Package Manager:** npm

## Project Structure

- `client/` - React frontend application
  - `src/components/` - UI components (shadcn/ui + custom)
  - `src/hooks/` - Custom React hooks
  - `src/lib/` - Core logic (auth, db, sync, theme)
  - `src/pages/` - Page-level components
  - `public/` - Static assets, PWA manifest, service worker
- `server/` - Express backend
  - `routes.ts` - API endpoints (auth, admin, sync)
  - `storage.ts` - Database interface
  - `db.ts` - PostgreSQL connection (Drizzle)
  - `vite.ts` - Vite dev middleware
  - `static.ts` - Production static file serving
- `shared/` - Shared code
  - `schema.ts` - Drizzle schema + Zod validation
- `script/` - Build utilities

## Architecture

The server (`server/index.ts`) runs on port 5000 and serves both the API and the frontend via Vite middleware in development, or static files in production. Both host on `0.0.0.0`.

## Key Features

- Role-based access control (Admin, Manager, Cashier)
- Offline-first with IndexedDB; syncs to PostgreSQL every 60 seconds
- Atomic checkout (orders + stock updates succeed together)
- Business profiles with customizable themes
- PWA-installable

## Development

```bash
npm run dev       # Start dev server on port 5000
npm run build     # Build for production
npm run db:push   # Sync database schema
```

## Default Admin Credentials

- **Username:** admin
- **Password:** admin123 (change immediately in production!)

## Environment Variables

See `.env.example` for all required/optional variables:
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Strong random string for signing sessions (required in production)
- `PORT` — Server port (default: 5000)
- `NODE_ENV` — Set to `production` for production deployments

## Security Notes

- `SESSION_SECRET` must be set in production; the server will refuse to start without it
- Session cookies use `secure: true` in production (HTTPS-only)
- Login endpoint is rate-limited to 10 requests per 15 minutes per IP
- A warning is logged at startup if the default admin password is unchanged
- All sync API routes require authentication; the sync status endpoint is also protected
- Sync routes reject batches exceeding 500 items

## Deployment

### Replit / VPS (current)
- **Target:** Autoscale
- **Build:** `npm run build`
- **Run:** `node dist/index.cjs`
- Requires `DATABASE_URL` and `SESSION_SECRET` environment variables

### Vercel
- See `DEPLOYMENT.md` for full instructions
- `vercel.json` at project root configures routing
- `api/index.ts` is the serverless Express entry point
- Static assets served from Vercel CDN (`dist/public`)
- API routes routed to serverless function via `/api/:path*` rewrite
- `vercel-build` script (`vite build`) generates the frontend for Vercel

## Server Architecture

- `server/app.ts` — App factory (`createApp()` + `log()`), shared by all entry points
- `server/index.ts` — Traditional entry (adds static/Vite serving, starts HTTP listener)
- `api/index.ts` — Vercel serverless entry (exports Express handler, no static serving)
- Database pool: auto-limits to 2 connections on Vercel (`VERCEL=1`), configurable via `DB_POOL_MAX`
