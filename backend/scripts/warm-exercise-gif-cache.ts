// One-time cache warm-up, safe to re-run: fetches each exercise's WorkoutX
// GIF (and generates its list thumbnail) exactly once, for every exercise
// that doesn't already have one cached — the same fetch that would
// otherwise happen lazily the first time some user opens that exercise's
// detail page (see src/services/workoutXGifService.ts). Running it once up
// front just means every exercise's list thumbnail is ready from day one
// instead of filling in gradually as real users browse.
//
// This is still one fetch per exercise, ever, cached on the server and
// shared by every user afterward — not a bulk re-scrape of anything already
// cached, and nothing is fetched for exercises nobody's app will ever show
// (exercises with no WorkoutX match are skipped, same as everywhere else).
// A delay between requests keeps this from hammering the API.
//
// Run with: npx tsx scripts/warm-exercise-gif-cache.ts
// Add --dry-run to only report what would be fetched, without calling the API.
import { prisma } from "../src/prisma.js";
import {
  findWorkoutXMatch,
  getOrFetchGifPath,
  isGifCached,
} from "../src/services/workoutXGifService.js";

const DELAY_MS = 750;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!dryRun && !process.env.WORKOUTX_API_KEY) {
    throw new Error(
      "WORKOUTX_API_KEY is not set — every fetch would silently no-op. " +
        "Set it in the environment before running this for real.",
    );
  }

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true },
  });

  let fetched = 0;
  let alreadyCached = 0;
  let noMatch = 0;
  let failed = 0;

  for (const exercise of exercises) {
    const match = findWorkoutXMatch(exercise.name);
    if (!match) {
      noMatch++;
      continue;
    }

    const wasCached = isGifCached(match.id);

    if (dryRun) {
      if (wasCached) alreadyCached++;
      else fetched++;
      continue;
    }

    try {
      const path = await getOrFetchGifPath(match.id);
      if (!path) {
        failed++;
        continue;
      }
      if (wasCached) {
        alreadyCached++;
      } else {
        fetched++;
        // Only pace ourselves when a real network request just happened —
        // no need to slow down on cache hits.
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`Failed for "${exercise.name}" (${match.id}):`, err);
      failed++;
    }
  }

  console.log(
    `${dryRun ? "[dry run] " : ""}Fetched ${fetched}, already cached ${alreadyCached}, no WorkoutX match ${noMatch}, failed ${failed}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
