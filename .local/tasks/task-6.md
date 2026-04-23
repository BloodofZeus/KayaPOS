---
title: Fix SSL, TypeScript error + database test page
---
# Fix SSL, TypeScript Error + Database Test Page

## What & Why

Three things needed to get Vercel + Supabase working properly:

**Bug 1 — SSL not enabled:** Supabase (and all cloud PostgreSQL providers)
require SSL. The current `pg.Pool` in `server/db.ts` and the session pool
in `server/routes.ts` have no SSL config, so connections are rejected silently.
Fix: add `ssl: true` to both pools when the host is not localhost/127.0.0.1.

**Bug 2 — TypeScript error at routes.ts:255:** `req.params.id` is typed as
`string | string[]` in the Express version in use, but `storage.updateUser`
expects `string`. Vercel flags this as a build error. Fix: narrow the param
to `string` inline.

**Feature — Database connection test page:** Before login, users need a way
to verify their database URL works without deploying blind. Add:
- A `POST /api/setup/test-db` endpoint (no auth, rate-limited) that accepts
  a `{ url }` body, attempts a `SELECT 1` against that URL, and returns
  `{ ok: true }` or `{ ok: false, error: string }`.
- A "Test Database" section on the Login page with a URL input field, a
  Test button, and a clear success/error status. Collapsed by default, expands
  with a small link below the login form. Guides the user to paste their
  Supabase/Vercel Postgres connection string and confirms it works before
  they try to log in.

## Done looks like

- Deploying to Vercel with a Supabase DATABASE_URL connects successfully
- Login works with the correct admin credentials
- TypeScript build passes with no errors
- On the login page, clicking "Check database connection" expands a panel
  where the user can paste a URL, click Test, and see a green success or
  red error message with the specific failure reason
- Replit dev environment is unaffected

## Out of scope

- Saving the tested URL anywhere (it must be set via Vercel env vars)
- Changing any schema, auth logic, or existing routes

## Tasks

1. **Enable SSL on both database pools** — In `server/db.ts`, add `ssl: true`
   to the `pg.Pool` config. In `server/routes.ts`, add the same to the
   `sessionPool`. Detect remote hosts by checking if DATABASE_URL contains
   `localhost` or `127.0.0.1`; skip SSL for local dev.

2. **Fix TypeScript param type** — In `server/routes.ts` around line 255,
   narrow `req.params.id` to `string` before passing to `storage.updateUser`.

3. **Backend test-db endpoint** — Add `POST /api/setup/test-db` to
   `server/routes.ts`. No auth required. Rate-limited (5 req/min/IP). Accepts
   `{ url: string }`, creates a temporary `pg.Pool` with SSL enabled, runs
   `SELECT 1`, destroys the pool, and returns the result as JSON.

4. **Login page database test UI** — In `client/src/pages/Login.tsx`, add a
   small collapsible "Check database connection" link below the login form.
   When expanded, shows a URL text input, a Test button, and a status
   indicator. Calls `POST /api/setup/test-db` and displays the result.

## Relevant files

- `server/db.ts`
- `server/routes.ts:52-55,255`
- `client/src/pages/Login.tsx`