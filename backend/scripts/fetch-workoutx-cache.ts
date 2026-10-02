// Run manually, occasionally, whenever the WorkoutX catalog needs refreshing:
//   npx tsx scripts/fetch-workoutx-cache.ts
//
// Fetches the full exercise *metadata* catalog (names/ids, not GIF binaries)
// from the live WorkoutX API and saves it to prisma/workoutx-exercises.json,
// committed to the repo. src/services/workoutXGifService.ts reads this file
// to resolve "our" exercise names to WorkoutX ids, then fetches each GIF
// live, on demand, only the first time it's actually viewed.
import "dotenv/config";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { WorkoutX } from "@workoutx/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const apiKey = process.env.WORKOUTX_API_KEY;
  if (!apiKey) throw new Error("WORKOUTX_API_KEY is not set");

  const wx = new WorkoutX({ apiKey });

  const pageSize = 100;
  let offset = 0;
  let total = Infinity;
  const all = [];

  while (offset < total) {
    const page = await wx.exercises.list({ limit: pageSize, offset });
    total = page.total;
    all.push(...page.data);
    console.log(`Fetched ${all.length}/${total}`);
    offset += pageSize;
  }

  const outPath = join(__dirname, "../prisma/workoutx-exercises.json");
  writeFileSync(outPath, JSON.stringify(all, null, 2));
  console.log(`Saved ${all.length} exercises to ${outPath}`);
}

main().catch(console.error);
