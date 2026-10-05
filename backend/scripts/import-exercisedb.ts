// Syncs the built-in exercise catalog with the licensed ExerciseDB pack on
// the server's volume (see src/services/exerciseDb.ts for where it lives and
// exactly what the sync does). Idempotent — runs on every container start
// (docker-entrypoint.sh) and can be re-run by hand at any time.
//
// Run with: npx tsx scripts/import-exercisedb.ts
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/prisma.js";
import {
  EXERCISEDB_DIR,
  importExerciseDb,
  loadExerciseDbCatalog,
} from "../src/services/exerciseDb.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const entries = loadExerciseDbCatalog();
  if (!entries) {
    // Not fatal: the app runs, built-in exercises just have no GIF until
    // the pack is uploaded to the volume.
    console.warn(
      `⚠️  ExerciseDB pack not found in ${EXERCISEDB_DIR} — skipping exercise import.`,
    );
    return;
  }

  // Old WorkoutX catalog names → their (shared) ExerciseDB id, so exercises
  // created from the previous catalog keep their identity — and users their
  // history — when they're linked and renamed. Only our own former names
  // and numeric ids, no ExerciseDB content.
  const legacyIds = JSON.parse(
    readFileSync(join(__dirname, "../prisma/legacy-exercise-ids.json"), "utf-8"),
  ) as Record<string, string>;

  const stats = await importExerciseDb(prisma, entries, legacyIds);
  console.log(
    `✅ ExerciseDB: ${stats.linked} linked (${stats.renamed} renamed), ${stats.created} created, ${stats.deleted} removed, ${stats.keptWithoutGif} kept without GIF (still used).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
