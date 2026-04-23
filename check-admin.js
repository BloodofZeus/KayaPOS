import pg from 'pg';

const url = "postgresql://neondb_owner:npg_asJyj4u6dhOz@ep-broad-lab-acadnkr5-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkAdmin() {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT id, username, role FROM users WHERE username = 'admin'");
    console.log("Admin user found:", res.rows);
  } catch (err) {
    console.error("Error checking admin:", err);
  } finally {
    await pool.end();
  }
}

checkAdmin();
