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
    const app = await getApp();
    (app as unknown as NodeHandler)(req, res);
  } catch (err) {
    console.error("Handler initialization error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : "Unknown error during initialization",
          stack: process.env.NODE_ENV === "development" ? (err as Error).stack : undefined,
        }),
      );
    }
  }
}
