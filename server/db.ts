import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

export function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function maxConns(): number {
  return process.env.VERCEL
    ? 1
    : parseInt(process.env.DB_POOL_MAX || "10", 10);
}

export function buildPool(url: string): any {
  const isRemote = isRemoteHost(url);
  // We only import 'pg' here to avoid loading it at the top level
  // which causes issues on some serverless platforms
  const pg = require("pg");
  return new pg.Pool({
    connectionString: url,
    max: maxConns(),
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });
}

let _db: any | null = null;

function initDb(): any {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return new Proxy({} as any, {
        get() {
          throw new Error("DATABASE_URL is not configured.");
        }
      });
    }

    if (process.env.VERCEL) {
      const sql = neon(url);
      _db = drizzleNeon(sql, { schema });
    } else {
      const { drizzle } = require("drizzle-orm/node-postgres");
      const pool = buildPool(url);
      _db = drizzle(pool, { schema });
    }
  }
  return _db;
}

export const db: any = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    return (initDb() as any)[prop];
  },
});

export async function reinitializeDb(url: string): Promise<void> {
  if (process.env.VERCEL) {
    const sql = neon(url);
    _db = drizzleNeon(sql, { schema });
  } else {
    const pool = buildPool(url);
    _db = drizzle(pool, { schema });
  }
  process.env.DATABASE_URL = url;
}
