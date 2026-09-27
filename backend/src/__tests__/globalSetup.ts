import { execSync } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const testDbPath = path.resolve(backendRoot, "prisma/test.db");

// Runs once for the whole test run (not per test file) — provisions a fresh
// SQLite file and applies every migration, the same way docker-entrypoint.sh
// does for a real deploy.
export default function setup() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    if (fs.existsSync(testDbPath + suffix)) fs.rmSync(testDbPath + suffix);
  }
  execSync("npx prisma migrate deploy", {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "inherit",
  });
}
