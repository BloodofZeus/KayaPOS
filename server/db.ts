import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

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

let _pool: pg.Pool = buildPool(process.env.DATABASE_URL);
let _db = drizzle(_pool, { schema });

export { _db as db };

export async function reinitializeDb(url: string): Promise<void> {
  const oldPool = _pool;
  _pool = buildPool(url);
  _db = drizzle(_pool, { schema });
  process.env.DATABASE_URL = url;
  oldPool.end().catch(() => {});
}
