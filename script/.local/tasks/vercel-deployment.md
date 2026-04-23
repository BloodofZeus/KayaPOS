# Vercel Deployment Configuration

  ## What & Why
  The app is currently configured for traditional long-running Node.js hosting (Replit / VPS). Vercel is a serverless platform, so the project needs a Vercel configuration file, a serverless-compatible entry point for the Express app, a database connection strategy that works under cold-start / per-request lifecycle, and a build process that produces the outputs Vercel expects.

  ## Done looks like
  - A `vercel.json` file exists at the project root that routes all traffic correctly: API routes to the Express serverless function, and static assets served from the Vite build output (`dist/public`).
  - A new `api/index.ts` file exports the Express app in a way that Vercel's Node.js runtime can invoke it as a serverless function (using `@vercel/node` or the standard module-export pattern).
  - `server/db.ts` configures the `pg.Pool` with a low `max` connection count (2–3) so that many concurrent serverless cold starts don't exhaust the PostgreSQL connection limit.
  - `package.json` has a `vercel-build` script (or the build script is updated) so Vercel runs `npm run build` to compile both the frontend and the server entry.
  - A `DEPLOYMENT.md` (or additions to `README.md`) documents the required Vercel environment variables: `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV=production`.
  - The app boots and serves correctly both on Replit (unchanged) and when deployed to Vercel.

  ## Out of scope
  - Migrating the database host away from Replit's PostgreSQL to Neon or another cloud provider (user can configure any `DATABASE_URL`).
  - WebSocket-based real-time features (the codebase has no production WebSocket endpoints — HMR is dev-only).
  - Edge runtime (use standard Node.js serverless functions only).
  - CI/CD pipeline configuration.

  ## Tasks
  1. **Create the Vercel serverless entry point** — Create `api/index.ts` that imports and re-exports the Express app for Vercel's Node.js serverless runtime, ensuring the app initializes once per warm instance.

  2. **Add vercel.json** — Create `vercel.json` with a build configuration pointing at the Vite build output (`dist/public`) for static assets, and a function route that forwards all `/api/*` and unmatched requests to the Express function in `api/index.ts`.

  3. **Limit database pool connections** — In `server/db.ts`, add a `max: 2` (or environment-variable-driven) cap to the `pg.Pool` constructor so that serverless cold starts do not open runaway connections.

  4. **Add vercel-build script** — In `package.json`, add a `"vercel-build"` script that runs the existing `npm run build` command, which already compiles the Vite frontend and bundles the server.

  5. **Document deployment environment variables** — Add a `DEPLOYMENT.md` at the project root listing `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, and instructions for setting them in the Vercel dashboard.

  ## Relevant files
  - `server/index.ts`
  - `server/db.ts`
  - `server/routes.ts`
  - `server/static.ts`
  - `vite.config.ts`
  - `script/build.ts`
  - `package.json`
  