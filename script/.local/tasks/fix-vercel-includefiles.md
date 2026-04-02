# Fix vercel.json includeFiles Schema Error

## What & Why

Vercel's schema validation rejects `includeFiles` as an array — it only accepts
a single string glob. The current value `["dist/public/**", "migrations/**"]`
fails validation and blocks deployment.

The fix has two parts:
1. Change `includeFiles` back to a single string: `"migrations/**"` (all the
   function needs at runtime is the migration SQL files).
2. Update the SPA fallback route from `{ "src": "/(.*)", "dest": "/api/index.ts" }`
   to `{ "src": "/(.*)", "dest": "/index.html" }` so unmatched routes are served
   directly by Vercel's CDN from `dist/public/index.html` — eliminating the need
   for Express to serve the HTML file at all, which is why `dist/public/**` was
   in `includeFiles` in the first place.

## Done looks like

- `vercel.json` passes Vercel schema validation
- API routes (`/api/*`) still go to the Express function
- SPA routes (`/pos`, `/dashboard`, etc.) get `index.html` from Vercel CDN
- Migration files are still bundled with the function for auto-migration on startup

## Out of scope

- Any other routing or function changes

## Tasks

1. **Fix vercel.json** — Change `includeFiles` to `"migrations/**"` (string).
   Change the SPA catch-all route destination from `/api/index.ts` to `/index.html`.

## Relevant files

- `vercel.json`
