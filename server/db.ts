import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";
import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export type AppDatabase = NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;

export function isRemoteHost(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function maxConns(): number {
  return process.env.VERCEL
    ? 1
    : parseInt(process.env.DB_POOL_MAX || "10", 10);
}

export function buildPool(url: string): Pool {
  const isRemote = isRemoteHost(url);
  // Using dynamic require for pg to avoid bundling issues on Vercel
  const pg = require("pg");
  const PoolClass = pg.Pool || pg.default?.Pool;
  return new PoolClass({
    connectionString: url,
    max: maxConns(),
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000, // Increased timeout for remote connections
  });
}

let _db: AppDatabase | null = null;

function initDb(): AppDatabase {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("[db] DATABASE_URL environment variable is missing!");
      // On Vercel, this is a fatal error for database-connected routes
      return new Proxy({} as any, {
        get() {
          throw new Error("DATABASE_URL is not configured. Please add it to your Vercel Environment Variables.");
        }
      }) as unknown as AppDatabase;
    }

    try {
      if (process.env.VERCEL) {
        console.log("[db] Initializing Neon HTTP database client for Vercel...");
        // Neon HTTP driver works best with 'neon' package
        const sql = neon(url);
        _db = drizzleNeon(sql, { schema });
      } else {
        console.log("[db] Initializing Node-Postgres database client for local/VPS...");
        const { drizzle } = require("drizzle-orm/node-postgres");
        const pool = buildPool(url);
        _db = drizzle(pool, { schema });
      }
    } catch (err: any) {
      console.error(`[db] Critical database initialization error: ${err.message}`);
      throw err;
    }
  }
  return _db!;
}

export const db: AppDatabase = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    // If _db is not initialized, initDb will attempt to initialize it synchronously.
    // This is safe because drizzle-orm clients are created synchronously.
    return (initDb() as any)[prop];
  },
});

export { initDb };

export async function reinitializeDb(url: string): Promise<void> {
  console.log(`[db] Re-initializing database with new URL (isRemote: ${isRemoteHost(url)})...`);
  if (process.env.VERCEL) {
    const sql = neon(url);
    _db = drizzleNeon(sql, { schema });
  } else {
    const { drizzle } = require("drizzle-orm/node-postgres");
    const pool = buildPool(url);
    _db = drizzle(pool, { schema });
  }
  process.env.DATABASE_URL = url;
}
