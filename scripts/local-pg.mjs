// Dev-only helper: runs a real local Postgres (no system install needed) for
// `prisma migrate dev` and manual testing. Not used in production (Railway
// provides DATABASE_URL there). Run with: node scripts/local-pg.mjs
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { existsSync, readdirSync } from "node:fs";

const dataDir = path.resolve("./.local-pg-data");
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 54329,
  persistent: true,
});

const isInitialized = existsSync(dataDir) && readdirSync(dataDir).length > 0;
if (!isInitialized) {
  await pg.initialise();
}

await pg.start();
console.log("Local Postgres running on postgres://postgres:postgres@localhost:54329/modogoat");

try {
  await pg.createDatabase("modogoat");
} catch {
  // ya existe
}

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
