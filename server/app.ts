import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { registerRoutes } from "./routes";
import path from "path";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  app.set("trust proxy", 1);

  if (process.env.DATABASE_URL) {
    // Run migrations in background on Vercel to avoid cold start timeout
    const runMigrations = async () => {
      try {
        // Try to find migrations in common locations
        const possiblePaths = [
          path.join(process.cwd(), "migrations"),
          path.join(process.cwd(), "dist", "migrations"),
          path.join(process.cwd(), "server", "migrations"),
        ];

        let migrationsFolder = "";
        const fs = await import("fs");
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            migrationsFolder = p;
            break;
          }
        }

        if (migrationsFolder) {
          log(`[app] Running migrations from ${migrationsFolder}...`);
          await migrate(db, { migrationsFolder });
          log("[app] Migrations completed successfully.");
        } else {
          log("[app] Could not find migrations folder — skipping auto-migration.", "warn");
        }
      } catch (err: any) {
        log(`[app] Migration failed: ${err.message}`, "error");
      }
    };

    if (process.env.VERCEL) {
      runMigrations().catch(err => log(`[app] Background migration failed: ${err.message}`, "error"));
    } else {
      await runMigrations();
    }
  } else {
    log("[app] DATABASE_URL not set — skipping migrations.", "warn");
  }

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  return { app, httpServer };
}
