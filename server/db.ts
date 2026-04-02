import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

export function isRemoteHost(url: string): boolean {
  return !url.includes("localhost") && !url.includes("127.0.0.1");
}

function maxConns(): number {
  return process.env.VERCEL
    ? 2
    : parseInt(process.env.DB_POOL_MAX || "10", 10);
}

function buildPool(url: string): pg.Pool {
  return new pg.Pool({
    connectionString: url,
    max: maxConns(),
    ssl: isRemoteHost(url) ? true : false,
  });
}

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _pool: pg.Pool | null = null;
let _db: DrizzleDB | null = null;

function initDb(): DrizzleDB {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not configured. Set this environment variable in your deployment settings and restart."
      );
    }
    _pool = buildPool(url);
    _db = drizzle(_pool, { schema });
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
  _db = drizzle(_pool, { schema });
  process.env.DATABASE_URL = url;
  oldPool?.end().catch(() => {});
}
