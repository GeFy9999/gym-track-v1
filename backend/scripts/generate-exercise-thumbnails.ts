// One-time backfill: generates a static JPEG thumbnail (first frame) for
// every exercise GIF already cached locally. Purely local image processing
// — reads files already on disk, never calls the WorkoutX API, so it's safe
// to re-run any time (skips files that already have a thumbnail).
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GIFS_DIR = join(__dirname, "../public/exercise-gifs");
const THUMBS_DIR = join(__dirname, "../public/exercise-thumbnails");

async function main() {
  if (!existsSync(GIFS_DIR)) {
    console.log("No exercise-gifs directory yet, nothing to do.");
    return;
  }
  mkdirSync(THUMBS_DIR, { recursive: true });

  const gifFiles = readdirSync(GIFS_DIR).filter((f) => extname(f) === ".gif");
  let generated = 0;
  let skipped = 0;

  for (const file of gifFiles) {
    const wxId = basename(file, ".gif");
    const thumbPath = join(THUMBS_DIR, `${wxId}.jpg`);
    if (existsSync(thumbPath)) {
      skipped++;
      continue;
    }
    await sharp(join(GIFS_DIR, file)).jpeg({ quality: 80 }).toFile(thumbPath);
    generated++;
  }

  console.log(`Generated ${generated} thumbnails, ${skipped} already existed.`);
}

main().catch(console.error);
