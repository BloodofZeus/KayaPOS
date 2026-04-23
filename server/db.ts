import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import pg from "pg";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

// For Neon serverless
if (process.env.VERCEL) {
  neonConfig.webSocketConstructor = ws;
}

export function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function maxConns(): number {
  return process.env.VERCEL
    ? 2
    : parseInt(process.env.DB_POOL_MAX || "10", 10);
}

export function buildPool(url: string): pg.Pool | Pool {
  const isRemote = isRemoteHost(url);
  const config = {
    connectionString: url,
    max: maxConns(),
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  };
  return process.env.VERCEL ? new Pool(config) : new pg.Pool(config);
}

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _pool: pg.Pool | Pool | null = null;
let _db: any | null = null;

function initDb(): DrizzleDB {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      // Return a proxy that throws error only when called, to avoid crashing during initialization
      return new Proxy({} as DrizzleDB, {
        get() {
          throw new Error("DATABASE_URL is not configured.");
        }
      });
    }
    _pool = buildPool(url);
    _db = process.env.VERCEL 
      ? drizzleNeon(_pool as Pool, { schema })
      : drizzle(_pool as pg.Pool, { schema });
  }
  return _db;
}

export const db: DrizzleDB = new Proxy({} as DrizzleDB, {
  get(_target, prop: string | symbol) {
    return (initDb() as any)[prop];
  },
});

export async function reinitializeDb(url: string): Promise<void> {
  const oldPool = _pool;
  _pool = buildPool(url);
  _db = process.env.VERCEL 
    ? drizzleNeon(_pool as Pool, { schema })
    : drizzle(_pool as pg.Pool, { schema });
  process.env.DATABASE_URL = url;
  if (oldPool) {
    (oldPool as any).end().catch(() => {});
  }
}
