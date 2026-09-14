// Connection check: prints the database name and PostgreSQL version.
// It never prints DATABASE_URL — evidence must stay free of secrets.
import { pool } from "../src/database/pool.js";

console.log("✓ Environment variable found");

try {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      version() AS postgres_version
  `);
  console.log("✓ Database connection established");
  console.log("✓ PostgreSQL version detected");
  console.log(result.rows[0]);
} catch (error) {
  if (error.code === "28P01") {
    console.error(
      "✗ Supabase rejected the database credentials. Refresh the project password and update DATABASE_URL in .env."
    );
  }
  throw error;
} finally {
  // This is a script that must exit, so closing the whole pool is correct
  // HERE. The Express server never calls pool.end() per request.
  await pool.end();
}
