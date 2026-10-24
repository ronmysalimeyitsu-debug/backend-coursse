import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { loadConfig } from "../src/config/env.js";

const directory = fileURLToPath(new URL("../database/migrations/", import.meta.url));
const config = loadConfig({ requireAuth: false });
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  options: "-c search_path=m24_class_autoguide,public",
  connectionTimeoutMillis: 5000
});

try {
  await pool.query("CREATE SCHEMA IF NOT EXISTS m24_class_autoguide");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS m24_class_autoguide.schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const files = (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of files) {
    const { rowCount } = await pool.query(
      "SELECT 1 FROM m24_class_autoguide.schema_migrations WHERE name = $1",
      [name]
    );
    if (rowCount) {
      console.log(`Already applied: ${name}`);
      continue;
    }

    const sql = await readFile(path.join(directory, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO m24_class_autoguide.schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`Applied: ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Migration failed (${name}); transaction rolled back. Database error code: ${error.code ?? "unknown"}`);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }
} catch (error) {
  console.error(`Migration runner failed. Database error code: ${error.code ?? "unknown"}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
