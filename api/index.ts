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
  const app = await getApp();
  (app as unknown as NodeHandler)(req, res);
}
