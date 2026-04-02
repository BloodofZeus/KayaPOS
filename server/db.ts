import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const maxConnections = process.env.VERCEL
  ? 2
  : parseInt(process.env.DB_POOL_MAX || "10", 10);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
});

export const db = drizzle(pool, { schema });
