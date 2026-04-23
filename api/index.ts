import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/app";
import { serveStatic } from "../server/static";

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let appInstance: Express | undefined;

async function getApp(): Promise<Express> {
  if (!appInstance) {
    const { app } = await createApp();
    // On Vercel, static files are handled by the platform's own static serving (vercel.json)
    // and don't need to be served from the serverless function, which reduces cold start times.
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
      serveStatic(app);
    }
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Simple health check to verify the function is alive
  if (req.url === "/api/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  try {
    console.log(`[handler] Incoming request: ${req.method} ${req.url}`);
    const app = await getApp();
    (app as unknown as NodeHandler)(req, res);
  } catch (err) {
    const errorDetails = {
      ok: false,
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : String(err),
      stack: process.env.NODE_ENV === "development" ? (err instanceof Error ? err.stack : undefined) : undefined,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      hasDbUrl: !!process.env.DATABASE_URL,
    };
    
    console.error("Handler initialization error:", errorDetails);
    
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(errorDetails));
    }
  }
}
