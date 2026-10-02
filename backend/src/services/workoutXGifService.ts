import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GIFS_DIR = join(__dirname, "../../public/exercise-gifs");
const CATALOG_PATH = join(__dirname, "../../prisma/workoutx-exercises.json");

type WorkoutXCatalogEntry = { id: string; name: string };

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// The catalog is just names/IDs (fetched once, see scripts/fetch-workoutx-cache.ts)
// — loading it doesn't touch the live API, so it's safe to keep in memory for
// the life of the process rather than re-reading it on every request.
let catalogByName: Map<string, WorkoutXCatalogEntry> | null = null;

function getCatalog(): Map<string, WorkoutXCatalogEntry> {
  if (!catalogByName) {
    const raw: WorkoutXCatalogEntry[] = existsSync(CATALOG_PATH)
      ? JSON.parse(readFileSync(CATALOG_PATH, "utf-8"))
      : [];
    catalogByName = new Map(raw.map((e) => [normalize(e.name), e]));
  }
  return catalogByName;
}

export function findWorkoutXMatch(exerciseName: string): WorkoutXCatalogEntry | null {
  return getCatalog().get(normalize(exerciseName)) ?? null;
}

// Fetches a single GIF from the live WorkoutX API and saves it locally. This
// is the ONLY place in the app that spends API quota, and it only runs the
// first time a given exercise's GIF is actually requested — every request
// after that for the same exercise is served from disk, no API call at all.
// This matches WorkoutX's terms ("cache... beyond what is needed for your
// application" is the prohibited pattern — fetching lazily, on real demand,
// one at a time, is the opposite of a bulk scrape).
export async function getOrFetchGifPath(wxId: string): Promise<string | null> {
  mkdirSync(GIFS_DIR, { recursive: true });
  const filePath = join(GIFS_DIR, `${wxId}.gif`);
  if (existsSync(filePath)) return filePath;

  const apiKey = process.env.WORKOUTX_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://api.workoutxapp.com/v1/gifs/${wxId}.gif`, {
    headers: { "X-WorkoutX-Key": apiKey },
  });
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(filePath, buffer);
  return filePath;
}
