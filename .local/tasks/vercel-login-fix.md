# Fix Vercel Login & Error Handling

## What & Why

Two code bugs prevent login from working on Vercel:

**Bug 1 — Trust proxy missing:** Vercel terminates HTTPS at its edge and forwards plain HTTP to the serverless function. Because Express doesn't know the connection is actually HTTPS, it refuses to set the session cookie with `secure: true` — so after login, the cookie is never sent to the browser, and every subsequent request appears unauthenticated. Fix: call `app.set("trust proxy", 1)` in `server/app.ts` so Express trusts the `X-Forwarded-Proto: https` header Vercel sends.

**Bug 2 — Unhandled startup errors return HTML:** If the app fails to initialize (missing `SESSION_SECRET`, unreachable database, etc.), the async error in `api/index.ts` propagates uncaught and Vercel returns a generic HTML error page. This is what the user sees as "Unexpected token 'A'... is not valid JSON". Fix: wrap the handler in try-catch and return a proper JSON error response.

## Done looks like

- Logging in on the Vercel deployment succeeds and keeps the user authenticated across requests
- If environment variables are missing or the DB is unreachable, the `/api/auth/login` endpoint returns a JSON error (not an HTML page) with a clear message
- No change to Replit/VPS behavior

## Out of scope

- Setting up the external PostgreSQL database (user action, not code)
- Changing the session or auth implementation beyond the two fixes above

## Tasks

1. **Add trust proxy in app factory** — In `server/app.ts`, set `app.set("trust proxy", 1)` early in `createApp()`, before middleware registration. This makes Express correctly detect HTTPS from Vercel's `X-Forwarded-Proto` header so secure cookies are sent.

2. **Add error boundary in Vercel handler** — In `api/index.ts`, wrap the entire `handler` function body in a try-catch. On error, write a `500` JSON response (`{ "error": "Service unavailable" }`) instead of letting the uncaught rejection produce an HTML error page.

## Relevant files

- `server/app.ts`
- `api/index.ts`
