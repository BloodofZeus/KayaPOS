---
title: Auto-migrate database schema on startup
---
# Auto-migrate Schema on Startup

## What & Why

Currently, after connecting a database, the user must manually run `npm run db:push`
from a terminal to create tables. This is a friction point — especially on Vercel
where there is no shell. 

The fix: run Drizzle's migrator automatically when the app starts. On first boot,
all tables are created. On subsequent boots, it's a no-op. The user only connects
a database and deploys — no terminal step needed.

## Done looks like

- After connecting Vercel Postgres (or any external PostgreSQL) and deploying,
  the app creates all tables on its own first cold-start
- Login works immediately after first deploy — no `db:push` required
- Subsequent deploys do not re-run migrations unnecessarily
- Replit development workflow is unchanged

## Out of scope

- Changing any table schema or column definitions
- Adding a migration history UI
- Supporting rollbacks

## Tasks

1. **Generate migration files** — Run `drizzle-kit generate` to produce a SQL
   migration file from the current schema. These files are committed to the repo
   so Vercel bundles them with the function.

2. **Run migrator on startup** — In `server/app.ts`, call Drizzle's `migrate()`
   before `registerRoutes()`. This applies any pending migrations automatically
   each time the app initializes. On Vercel, include the migrations directory
   in the function bundle via `vercel.json` `includeFiles`.

## Relevant files

- `server/app.ts`
- `server/db.ts`
- `vercel.json`
- `drizzle.config.ts`