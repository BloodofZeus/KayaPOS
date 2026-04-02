import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/app";
import { serveStatic } from "../server/static";

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let appInstance: Express | undefined;

async function getApp(): Promise<Express> {
  if (!appInstance) {
    const { app } = await createApp();
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    }
    appInstance = app;
  }
  return appInstance;
}

function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function handleSetupEndpoints(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = (req.url || "").split("?")[0];
  const isTestDb = req.method === "POST" && url === "/api/setup/test-db";
  const isActivateDb = req.method === "POST" && url === "/api/setup/activate-db";

  if (!isTestDb && !isActivateDb) return false;

  if (process.env.DISABLE_DB_TEST === "1") {
    jsonResponse(res, 404, { ok: false, error: "This endpoint is disabled." });
    return true;
  }

  const body = await readJsonBody(req);
  const dbUrl = typeof body.url === "string" ? body.url.trim() : "";

  if (!dbUrl) {
    jsonResponse(res, 400, { ok: false, error: "A database URL is required." });
    return true;
  }

  const pg = await import("pg");
  const testPool = new pg.default.Pool({
    connectionString: dbUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
    ssl: isRemoteHost(dbUrl) ? true : false,
  });

  try {
    const client = await testPool.connect();
    client.release();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed.";
    jsonResponse(res, 422, { ok: false, error: message });
    return true;
  } finally {
    testPool.end().catch(() => {});
  }

  if (isActivateDb) {
    if (process.env.VERCEL) {
      jsonResponse(res, 200, {
        ok: false,
        vercel: true,
        error:
          "On Vercel, each request is stateless — set DATABASE_URL in your Vercel project's Environment Variables instead.",
      });
      return true;
    }
    const { reinitializeDb } = await import("../server/db");
    await reinitializeDb(dbUrl);
  }

  jsonResponse(res, 200, { ok: true });
  return true;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (await handleSetupEndpoints(req, res)) return;

    const app = await getApp();
    (app as unknown as NodeHandler)(req, res);
  } catch (err) {
    console.error("Handler initialization error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Service unavailable",
          detail: err instanceof Error ? err.message : "Unknown error",
        }),
      );
    }
  }
}
