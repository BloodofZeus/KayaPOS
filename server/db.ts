import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export type AppDatabase = NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;

export function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function maxConns(): number {
  return process.env.VERCEL
    ? 1
    : parseInt(process.env.DB_POOL_MAX || "10", 10);
}

export function buildPool(url: string): Pool {
  const isRemote = isRemoteHost(url);
  const pg = require("pg");
  const PoolClass = pg.Pool || pg.default?.Pool;
  return new PoolClass({
    connectionString: url,
    max: maxConns(),
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });
}

let _db: AppDatabase | null = null;

function initDb(): AppDatabase {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error("[db] DATABASE_URL environment variable is missing!");
      return new Proxy({} as any, {
        get() {
          throw new Error("DATABASE_URL is not configured.");
        }
      }) as unknown as AppDatabase;
    }

    if (process.env.VERCEL) {
      console.log("[db] Initializing Neon HTTP database client for Vercel...");
      const sql = neon(url);
      _db = drizzleNeon(sql, { schema });
    } else {
      console.log("[db] Initializing Node-Postgres database client for local/VPS...");
      const { drizzle } = require("drizzle-orm/node-postgres");
      const pool = buildPool(url);
      _db = drizzle(pool, { schema });
    }
  }
  return _db!;
}

export const db: AppDatabase = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    return (initDb() as any)[prop];
  },
});

export { initDb };

export async function reinitializeDb(url: string): Promise<void> {
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
