import pg from "pg";
import { loadConfig } from "../config/env.js";

const { Pool } = pg;
const config = loadConfig();

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  options: "-c search_path=m24_class_autoguide,public",
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

pool.on("error", (error) => {
  console.error(JSON.stringify({
    level: "error",
    event: "database_pool_error",
    code: error.code ?? "UNKNOWN"
  }));
});

export async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
