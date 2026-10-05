import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import type { prisma as appPrisma } from "../prisma.js";

type PrismaClient = typeof appPrisma;

// ExerciseDB (DevWorx Consulting) — the licensed exercise catalog and GIFs
// behind every built-in exercise. Its EULA forbids making the raw pack
// (the full JSON, the GIF collection) available to anyone: it is NOT in this
// public repository. It lives on the server's persistent volume, by default
// <cwd>/data/exercisedb (= /app/data/exercisedb in the container):
//
//   exercises.json   the ExerciseDB JSON (array of exercises)
//   180/<id>.gif     small GIFs — list thumbnails are stills of these
//   360/<id>.gif     large GIFs — exercise detail / info screens
//
// GIFs are only ever served one at a time, for an exercise the app already
// lists, through the rate-limited /api/exercises/:id/gif|thumbnail routes —
// never as a browsable/enumerable static folder (EULA §13).
export const EXERCISEDB_DIR =
  process.env.EXERCISEDB_DIR ?? join(process.cwd(), "data/exercisedb");

const THUMBS_DIR = join(EXERCISEDB_DIR, "thumbnails");

export type ExerciseDbEntry = {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  description: string;
};

// ExerciseDB ids are 4 digits; anything else must never reach a file path.
const VALID_ID = /^\d{4}$/;

export function loadExerciseDbCatalog(): ExerciseDbEntry[] | null {
  const file = join(EXERCISEDB_DIR, "exercises.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8")) as ExerciseDbEntry[];
}

export function getExerciseDbGifPath(
  exerciseDbId: string,
  size: 180 | 360 = 360,
): string | null {
  if (!VALID_ID.test(exerciseDbId)) return null;
  const file = join(EXERCISEDB_DIR, String(size), `${exerciseDbId}.gif`);
  return existsSync(file) ? file : null;
}

// A static JPEG still (sharp reads a GIF's first frame by default) of the
// small GIF, for list rows that render many at once. Generated the first
// time it's asked for, then kept next to the pack on the persistent volume.
export async function getExerciseDbThumbnailPath(
  exerciseDbId: string,
): Promise<string | null> {
  const gif = getExerciseDbGifPath(exerciseDbId, 180);
  if (!gif) return null;

  const thumb = join(THUMBS_DIR, `${exerciseDbId}.jpg`);
  if (existsSync(thumb)) return thumb;

  mkdirSync(THUMBS_DIR, { recursive: true });
  await sharp(gif)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80 })
    .toFile(thumb);
  return thumb;
}

// ExerciseDB target muscle → the app's muscle groups. Mirrors how the
// previous catalog was already filed (cardio under Legs, neck under
// Trapèze), so every ExerciseDB exercise lands in a group.
const TARGET_TO_GROUP: Record<string, string> = {
  abs: "Abdominaux",
  obliques: "Abdominaux",
  "hip flexors": "Abdominaux",
  chest: "Chest",
  "serratus anterior": "Chest",
  lats: "Dos",
  "upper back": "Dos",
  "lower back": "Dos",
  biceps: "Biceps",
  triceps: "Triceps",
  shoulders: "Épaules",
  "rear deltoids": "Épaules",
  "rotator cuff": "Épaules",
  forearms: "Avant-bras",
  trapezius: "Trapèze",
  neck: "Trapèze",
  quadriceps: "Legs",
  hamstrings: "Legs",
  glutes: "Legs",
  "gluteus medius": "Legs",
  adductors: "Legs",
  abductors: "Legs",
  calves: "Legs",
  "tibialis anterior": "Legs",
  "tibialis posterior": "Legs",
  peroneals: "Legs",
  "cardiovascular system": "Legs",
};

const BODY_PART_TO_GROUP: Record<string, string> = {
  waist: "Abdominaux",
  chest: "Chest",
  back: "Dos",
  shoulders: "Épaules",
  "upper arms": "Biceps",
  "lower arms": "Avant-bras",
  neck: "Trapèze",
  "upper legs": "Legs",
  "lower legs": "Legs",
  cardio: "Legs",
};

export function muscleGroupNameFor(entry: ExerciseDbEntry): string {
  return (
    TARGET_TO_GROUP[entry.target] ?? BODY_PART_TO_GROUP[entry.bodyPart] ?? "Legs"
  );
}

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// "barbell deep back squat" → "Barbell Deep Back Squat",
// "3/4 sit-up" → "3/4 Sit-Up" (same style as the existing catalog names).
export function displayName(name: string): string {
  return name.replace(/(^|[\s\-/(])([a-z])/g, (_, sep: string, ch: string) =>
    sep + ch.toUpperCase(),
  );
}

// Display name for every entry. ExerciseDB has a few exercises sharing the
// exact same name (variants filmed differently) — the later ones by id get
// " V. 2", " V. 3"… (the naming the previous catalog used), so the list
// never shows two identical names.
export function displayNamesById(entries: ExerciseDbEntry[]): Map<string, string> {
  const result = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const entry of [...entries].sort((a, b) => a.id.localeCompare(b.id))) {
    const base = displayName(entry.name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    result.set(entry.id, count === 1 ? base : `${base} V. ${count}`);
  }
  return result;
}

export type ImportStats = {
  linked: number;
  renamed: number;
  created: number;
  deleted: number;
  keptWithoutGif: number;
};

// Makes the built-in exercise catalog match the ExerciseDB pack, without
// ever losing a user's data. Safe to run on every start (idempotent):
//
// - an existing built-in exercise is linked to its ExerciseDB entry — by
//   its stored exerciseDbId, its name, or (one-time migration from the
//   WorkoutX catalog, which used the same ids) its legacy name — then
//   renamed to the ExerciseDB name;
// - ExerciseDB entries nobody links to are created in their muscle group;
// - built-in exercises that end up with no ExerciseDB entry, or that
//   duplicate one already linked, are deleted — unless real data (a
//   session, a tracked record, a note, a loading-type choice) references
//   them, in which case they're kept as-is, just without a GIF.
//
// Custom exercises are never touched.
export async function importExerciseDb(
  prisma: PrismaClient,
  entries: ExerciseDbEntry[],
  legacyIds: Record<string, string>,
): Promise<ImportStats> {
  const stats: ImportStats = {
    linked: 0,
    renamed: 0,
    created: 0,
    deleted: 0,
    keptWithoutGif: 0,
  };

  const groups = await prisma.muscleGroup.findMany();
  const groupIdByName = new Map(groups.map((g) => [g.name, g.id]));

  const byId = new Map(entries.map((e) => [e.id, e]));
  const nameById = displayNamesById(entries);
  const idByName = new Map(
    entries.map((e) => [normalizeExerciseName(e.name), e.id]),
  );

  // Everything that references an exercise. Read whole tables (small)
  // rather than an IN (...) over 1000+ ids, which SQLite caps.
  const inUse = new Set<string>();
  const refs = await Promise.all([
    prisma.sessionExercise.findMany({ select: { exerciseId: true } }),
    prisma.trackedExercise.findMany({ select: { exerciseId: true } }),
    prisma.exerciseNote.findMany({ select: { exerciseId: true } }),
    prisma.exerciseLoadingType.findMany({ select: { exerciseId: true } }),
  ]);
  for (const rows of refs) for (const r of rows) inUse.add(r.exerciseId);

  const builtIns = await prisma.exercise.findMany({
    where: { isCustom: false },
    select: { id: true, name: true, exerciseDbId: true },
  });

  const claims = new Map<string, typeof builtIns>();
  const orphans: typeof builtIns = [];
  for (const ex of builtIns) {
    const normalized = normalizeExerciseName(ex.name);
    const candidates = [ex.exerciseDbId, idByName.get(normalized), legacyIds[normalized]];
    const id = candidates.find((c): c is string => !!c && byId.has(c));
    if (!id) {
      orphans.push(ex);
      continue;
    }
    const list = claims.get(id) ?? [];
    list.push(ex);
    claims.set(id, list);
  }

  const remove = async (exerciseId: string) => {
    try {
      await prisma.exercise.delete({ where: { id: exerciseId } });
      stats.deleted++;
    } catch {
      // Referenced after all (foreign key) — keep it.
      stats.keptWithoutGif++;
    }
  };

  for (const entry of entries) {
    const name = nameById.get(entry.id)!;
    const claimers = claims.get(entry.id) ?? [];

    if (claimers.length === 0) {
      const muscleGroupId = groupIdByName.get(muscleGroupNameFor(entry));
      if (!muscleGroupId) continue;
      await prisma.exercise.create({
        data: { name, muscleGroupId, exerciseDbId: entry.id, isCustom: false },
      });
      stats.created++;
      continue;
    }

    // One row per ExerciseDB entry: the one real data points to (or the
    // first) is kept; other unused duplicates go, used ones stay linked.
    const ordered = [...claimers].sort(
      (a, b) => Number(inUse.has(b.id)) - Number(inUse.has(a.id)),
    );
    for (const [i, ex] of ordered.entries()) {
      if (i > 0 && !inUse.has(ex.id)) {
        await remove(ex.id);
        continue;
      }
      if (ex.exerciseDbId !== entry.id || ex.name !== name) {
        await prisma.exercise.update({
          where: { id: ex.id },
          // The old catalog's still image belonged to the old source; the
          // ExerciseDB GIF replaces it.
          data: { exerciseDbId: entry.id, name, image: null },
        });
        if (ex.name !== name) stats.renamed++;
      }
      stats.linked++;
    }
  }

  for (const ex of orphans) {
    if (inUse.has(ex.id)) stats.keptWithoutGif++;
    else await remove(ex.id);
  }

  return stats;
}
