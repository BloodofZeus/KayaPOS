import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
import { createApp } from "../server/app";

let appInstance: Express | undefined;

async function getApp(): Promise<Express> {
  if (!appInstance) {
    const { app } = await createApp();
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const app = await getApp();
  app(req as any, res as any);
}
