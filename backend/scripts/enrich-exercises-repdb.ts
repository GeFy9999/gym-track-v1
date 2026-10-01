// One-off enrichment: matches existing Exercise rows by name against the
// RepDB free dataset (prisma/repdb-exercises.json) and fills in `image`
// (RepDB "start" pose) + `peakImage` ("peak" pose) for any match. Existing
// exercises are matched, never replaced or deleted — safe to re-run.
//
// RepDB free tier license requires visible attribution ("Exercise data by
// RepDB (repdb.co)") wherever this data is shown — see AboutCredits or the
// exercise info modal.
//
// Usage: npx tsx scripts/enrich-exercises-repdb.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/prisma.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPDB_BASE_URL = "https://exercise-dataset.com/";

type RepDbExercise = {
  name_en: string;
  images?: {
    flat?: { start?: string; peak?: string };
  };
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const repdbPath = join(__dirname, "../prisma/repdb-exercises.json");
  const repdb: { exercises: RepDbExercise[] } = JSON.parse(
    readFileSync(repdbPath, "utf-8"),
  );

  const repdbByName = new Map<string, RepDbExercise>();
  for (const ex of repdb.exercises) {
    if (ex.images?.flat?.start) {
      repdbByName.set(normalize(ex.name_en), ex);
    }
  }

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true },
  });

  let matched = 0;
  for (const exercise of exercises) {
    const repdbMatch = repdbByName.get(normalize(exercise.name));
    if (!repdbMatch?.images?.flat?.start) continue;

    await prisma.exercise.update({
      where: { id: exercise.id },
      data: {
        image: REPDB_BASE_URL + repdbMatch.images.flat.start,
        peakImage: repdbMatch.images.flat.peak
          ? REPDB_BASE_URL + repdbMatch.images.flat.peak
          : null,
      },
    });
    matched++;
  }

  console.log(
    `Matched and updated ${matched} of ${exercises.length} exercises (RepDB has ${repdb.exercises.length} total).`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
