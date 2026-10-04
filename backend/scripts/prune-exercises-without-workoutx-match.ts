// One-time cleanup, safe to re-run: removes exercises that have no matching
// entry in the WorkoutX catalog (backend/prisma/workoutx-exercises.json) —
// these can never get a GIF, so they're just dead weight in the exercise
// list. Originally done by hand against the local dev database when the
// WorkoutX migration landed (see commit 2c942fc); this script exists so the
// same cleanup can actually be applied to any other environment
// (production) without touching data that's genuinely in use.
//
// An exercise already referenced by a real session, tracked-exercise entry,
// or note is left alone — the delete is rejected by the foreign key
// constraint, caught here, and reported as "kept (in use)" rather than
// failing the whole run.
//
// Run with: npx tsx scripts/prune-exercises-without-workoutx-match.ts
// Add --dry-run to only report what would happen, without deleting anything.
import { prisma } from "../src/prisma.js";
import { findWorkoutXMatch } from "../src/services/workoutXGifService.js";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true },
  });

  let kept = 0;
  let deleted = 0;
  let inUse = 0;

  for (const exercise of exercises) {
    if (findWorkoutXMatch(exercise.name)) {
      kept++;
      continue;
    }

    if (dryRun) {
      deleted++;
      continue;
    }

    try {
      await prisma.exercise.delete({ where: { id: exercise.id } });
      deleted++;
    } catch {
      // Foreign key constraint — a real session, tracked-exercise entry, or
      // note still references this one. Leave it in place rather than
      // failing the whole run.
      inUse++;
    }
  }

  console.log(
    `${dryRun ? "[dry run] " : ""}Kept ${kept} (WorkoutX match), deleted ${deleted}, left ${inUse} in place (still referenced by real data).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
