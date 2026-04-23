import pg from 'pg';

const url = "postgresql://neondb_owner:npg_asJyj4u6dhOz@ep-broad-lab-acadnkr5-pooler.sa-east-1.aws.neon.tech/kayapos?sslmode=require&channel_binding=require";

async function testConnection() {
  console.log("Testing connection to:", url);
  
  const pool = new pg.Pool({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("Attempting to connect to 'kayapos' database...");
    const client = await pool.connect();
    console.log("Successfully connected to 'kayapos'!");
    
    const res = await client.query("SELECT current_database()");
    console.log("Current database:", res.rows[0].current_database);
    
    client.release();
  } catch (err) {
    console.error("Connection failed!");
    console.error(err.message);
    
    if (err.message.includes("database \"kayapos\" does not exist")) {
        console.log("SUGGESTION: You need to create the 'kayapos' database in your Neon console.");
    }
  } finally {
    await pool.end();
  }
}

testConnection();
