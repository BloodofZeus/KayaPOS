---
title: Production Security & Code Hardening
---
# Production Security & Code Hardening

  ## What & Why
  The codebase has several security gaps and development-only code that must be fixed before going live. These include an insecure session cookie configuration, a hardcoded session secret fallback, an unauthenticated API endpoint, missing rate limiting on login, a development error overlay included in all builds, and no input-size validation on the sync API routes.

  ## Done looks like
  - Cookies have `secure: true` automatically enforced in production (HTTPS only).
  - The server refuses to start in production if `SESSION_SECRET` is not set as an environment variable (no fallback string).
  - The `/api/sync/status` endpoint requires authentication, like every other sync route.
  - Login endpoint is rate-limited (e.g. 10 attempts per 15 minutes per IP) using the already-allowlisted `express-rate-limit` package.
  - The Replit runtime-error overlay plugin is excluded from production Vite builds (dev-only condition, same pattern as the cartographer and dev-banner plugins).
  - Sync routes reject oversized payloads (e.g. max 200 items per batch request).
  - A `.env.example` file documents all required environment variables with descriptions.
  - A clear warning is logged at startup if the default admin credentials (`admin/admin123`) are still in use, prompting the operator to change them.

  ## Out of scope
  - Full Zod schema validation on every field of sync payloads.
  - CSRF protection (no browser-based form submissions; session cookie is httpOnly).
  - Changing or removing the default admin account creation logic.

  ## Tasks
  1. **Enforce SESSION_SECRET and secure cookie in production** — In `server/routes.ts`, throw an error if `SESSION_SECRET` is not set when `NODE_ENV=production`. Set `cookie.secure` to `true` in production.

  2. **Add rate limiting to login route** — Install/import `express-rate-limit` (already in allowlist) and apply a limiter (10 req / 15 min / IP) to the `POST /api/auth/login` route.

  3. **Protect the sync status endpoint** — Add the `requireAuth` middleware to `GET /api/sync/status`.

  4. **Move runtime-error overlay to dev-only** — In `vite.config.ts`, wrap the `runtimeErrorOverlay()` plugin inside the same `NODE_ENV !== "production"` condition as the cartographer and dev-banner plugins.

  5. **Add payload size guard on sync routes** — In each `POST /api/sync/*` handler, reject requests where the incoming array exceeds 500 items with a 400 response.

  6. **Add .env.example and startup default-admin warning** — Create `.env.example` listing `DATABASE_URL`, `SESSION_SECRET`, and `PORT`. In `ensureDefaultAdmin`, log a prominent warning if the default admin account exists and has never been modified.

  ## Relevant files
  - `server/routes.ts:33-54`
  - `server/routes.ts:99-132`
  - `server/routes.ts:427-440`
  - `server/routes.ts:445-461`
  - `vite.config.ts:5-25`