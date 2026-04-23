import pg from 'pg';

const url = "postgresql://neondb_owner:npg_asJyj4u6dhOz@ep-broad-lab-acadnkr5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkSessionsTable() {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT to_regclass('public.sessions') as table_exists");
    console.log("Sessions table exists:", res.rows[0].table_exists);
  } catch (err) {
    console.error("Error checking sessions table:", err);
  } finally {
    await pool.end();
  }
}

checkSessionsTable();
