// ONE-OFF, DESTRUCTIVE: wipes all workout data and the whole exercise
// catalog, then rebuilds the catalog from the ExerciseDB pack — for
// starting production clean after the switch to ExerciseDB, when the
// existing sessions were only test data.
//
// Deleted: sessions (+ their exercises and sets), tracked records, exercise
// notes, per-exercise loading-type choices, and every exercise (custom ones
// included).
// Kept: user accounts (and their subscription/loyalty state), schedules,
// body weight entries, progress photos, muscle groups.
//
// Run with: npx tsx scripts/reset-workout-data.ts --confirm
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
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Refusing to run without --confirm: this permanently deletes every session, set, record, note and exercise.",
    );
    process.exitCode = 1;
    return;
  }

  // Check the pack first, so the catalog is never left empty.
  const entries = loadExerciseDbCatalog();
  if (!entries) {
    console.error(`ExerciseDB pack not found in ${EXERCISEDB_DIR} — nothing deleted.`);
    process.exitCode = 1;
    return;
  }

  const [sets, sessionExercises, sessions, tracked, notes, loadingTypes, exercises] =
    await prisma.$transaction([
      prisma.set.deleteMany(),
      prisma.sessionExercise.deleteMany(),
      prisma.session.deleteMany(),
      prisma.trackedExercise.deleteMany(),
      prisma.exerciseNote.deleteMany(),
      prisma.exerciseLoadingType.deleteMany(),
      prisma.exercise.deleteMany(),
    ]);
  console.log(
    `🗑️  Deleted ${sessions.count} sessions, ${sessionExercises.count} session exercises, ${sets.count} sets, ${tracked.count} tracked records, ${notes.count} notes, ${loadingTypes.count} loading-type choices, ${exercises.count} exercises.`,
  );

  const legacyIds = JSON.parse(
    readFileSync(join(__dirname, "../prisma/legacy-exercise-ids.json"), "utf-8"),
  ) as Record<string, string>;
  const stats = await importExerciseDb(prisma, entries, legacyIds);
  console.log(`✅ ExerciseDB catalog rebuilt: ${stats.created} exercises.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
