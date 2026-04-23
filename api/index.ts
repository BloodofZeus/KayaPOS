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

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    console.log(`[handler] Incoming request: ${req.method} ${req.url}`);
    const app = await getApp();
    (app as unknown as NodeHandler)(req, res);
  } catch (err) {
    const errorDetails = {
      ok: false,
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
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
