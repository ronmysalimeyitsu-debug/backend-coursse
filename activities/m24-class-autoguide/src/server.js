import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { pool } from "./db/pool.js";

const config = loadConfig();
const app = createApp();
const server = app.listen(config.port, () => {
  console.log(JSON.stringify({ level: "info", event: "server_started", port: config.port }));
});

const expiryTimer = setInterval(() => {
  app.locals.expireReservations().catch((error) => {
    console.error(JSON.stringify({
      level: "error",
      event: "reservation_expiry_failed",
      databaseCode: error.code ?? "UNKNOWN"
    }));
  });
}, 60_000);
expiryTimer.unref();

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(expiryTimer);
  console.log(JSON.stringify({ level: "info", event: "server_shutdown", signal }));
  server.close(async (error) => {
    if (error) {
      console.error(JSON.stringify({ level: "error", event: "server_close_failed", code: error.code ?? "UNKNOWN" }));
      process.exitCode = 1;
    }
    await pool.end();
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
