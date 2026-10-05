import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import request from "supertest";

// A throwaway pack folder with made-up exercises and placeholder "GIFs" —
// the real (licensed) ExerciseDB pack must never be part of the repo.
const packDir = mkdtempSync(join(tmpdir(), "exercisedb-"));
process.env.EXERCISEDB_DIR = packDir;

const { prisma } = await import("../prisma.js");
const { app } = await import("../app.js");
const { importExerciseDb, displayNamesById } = await import(
  "../services/exerciseDb.js"
);
const { registerUser } = await import("./helpers.js");

const entry = (id: string, name: string, target: string, bodyPart = "x") => ({
  id,
  name,
  target,
  bodyPart,
  equipment: "barbell",
  secondaryMuscles: [],
  instructions: [],
  description: "",
});

// Minimal valid 1x1 GIF.
const GIF = Buffer.from(
  "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

let groupId: (name: string) => string;

beforeAll(async () => {
  for (const name of ["Chest", "Legs", "Biceps", "Dos"]) {
    await prisma.muscleGroup.upsert({ where: { name }, update: {}, create: { name } });
  }
  const groups = await prisma.muscleGroup.findMany();
  groupId = (name) => groups.find((g) => g.name === name)!.id;

  mkdirSync(join(packDir, "180"), { recursive: true });
  mkdirSync(join(packDir, "360"), { recursive: true });
  for (const size of ["180", "360"]) {
    writeFileSync(join(packDir, size, "9001.gif"), GIF);
  }
});

const exerciseNamed = (name: string) =>
  prisma.exercise.findFirst({
    where: { name },
    select: { id: true, name: true, exerciseDbId: true, muscleGroupId: true },
  });

describe("ExerciseDB import", () => {
  it("links, renames, creates and cleans up the built-in catalog without losing user data", async () => {
    const { user } = await registerUser();
    const builtIn = (name: string, group = "Chest") =>
      prisma.exercise.create({
        data: { name, muscleGroupId: groupId(group), isCustom: false },
      });

    const byName = await builtIn("Test Barbell Press");
    const byLegacy = await builtIn("Old Legacy Name");
    const duplicate = await builtIn("test barbell press");
    const goneUnused = await builtIn("Retired Exercise");
    const goneUsed = await builtIn("Retired But Logged");
    const custom = await prisma.exercise.create({
      data: { name: "My Custom Move", muscleGroupId: groupId("Chest"), isCustom: true },
    });

    // Real data pointing at an exercise that ExerciseDB doesn't have.
    const session = await prisma.session.create({
      data: { userId: user.id, muscleGroup: "Chest", completed: true },
    });
    await prisma.sessionExercise.create({
      data: { sessionId: session.id, exerciseId: goneUsed.id },
    });

    const entries = [
      entry("9001", "test barbell press", "chest"),
      entry("9002", "legacy renamed curl", "biceps"),
      entry("9003", "brand-new sled push", "cardiovascular system", "cardio"),
    ];

    const stats = await importExerciseDb(prisma, entries, {
      "old legacy name": "9002",
    });

    expect(stats.created).toBe(1);

    // Matched by name, renamed to the ExerciseDB display name, same row.
    const linked = await exerciseNamed("Test Barbell Press");
    expect(linked?.id).toBe(byName.id);
    expect(linked?.exerciseDbId).toBe("9001");

    // Matched through the legacy (WorkoutX) name, renamed, same row & group.
    const legacy = await prisma.exercise.findUnique({
      where: { id: byLegacy.id },
      select: { name: true, exerciseDbId: true, muscleGroupId: true },
    });
    expect(legacy).toEqual({
      name: "Legacy Renamed Curl",
      exerciseDbId: "9002",
      muscleGroupId: groupId("Chest"),
    });

    // New entry created in its mapped group (cardio → Legs).
    const created = await exerciseNamed("Brand-New Sled Push");
    expect(created?.muscleGroupId).toBe(groupId("Legs"));
    expect(created?.exerciseDbId).toBe("9003");

    // Unused duplicate and unused orphan removed; logged orphan kept.
    expect(await prisma.exercise.findUnique({ where: { id: duplicate.id } })).toBeNull();
    expect(await prisma.exercise.findUnique({ where: { id: goneUnused.id } })).toBeNull();
    const kept = await prisma.exercise.findUnique({
      where: { id: goneUsed.id },
      select: { exerciseDbId: true },
    });
    expect(kept).toEqual({ exerciseDbId: null });

    // Custom exercises untouched.
    expect(
      await prisma.exercise.findUnique({ where: { id: custom.id }, select: { name: true } }),
    ).toEqual({ name: "My Custom Move" });

    // Idempotent.
    const again = await importExerciseDb(prisma, entries, {
      "old legacy name": "9002",
    });
    expect(again).toMatchObject({ created: 0, deleted: 0, renamed: 0 });
  });

  it("gives same-named variants distinct names", () => {
    const names = displayNamesById([
      entry("0002", "chin-up", "lats"),
      entry("0001", "chin-up", "lats"),
      entry("0003", "chin-up", "lats"),
    ]);
    expect([names.get("0001"), names.get("0002"), names.get("0003")]).toEqual([
      "Chin-Up",
      "Chin-Up V. 2",
      "Chin-Up V. 3",
    ]);
  });
});

describe("exercise API", () => {
  it("requires sign-in for the catalog and never exposes ExerciseDB ids", async () => {
    expect((await request(app).get("/api/exercises")).status).toBe(401);

    const { token } = await registerUser();
    const res = await request(app)
      .get("/api/exercises")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((e: object) => "exerciseDbId" in e)).toBe(false);
  });

  it("serves an exercise's GIF and thumbnail from the pack, 404 otherwise", async () => {
    const linked = await exerciseNamed("Test Barbell Press");

    const gif = await request(app).get(`/api/exercises/${linked!.id}/gif`);
    expect(gif.status).toBe(200);
    expect(gif.headers["content-type"]).toContain("image/gif");

    const thumb = await request(app).get(`/api/exercises/${linked!.id}/thumbnail`);
    expect(thumb.status).toBe(200);
    expect(thumb.headers["content-type"]).toContain("image/jpeg");

    // Linked, but its file isn't in the pack.
    const created = await exerciseNamed("Brand-New Sled Push");
    expect((await request(app).get(`/api/exercises/${created!.id}/gif`)).status).toBe(404);

    expect((await request(app).get(`/api/exercises/${randomUUID()}/gif`)).status).toBe(404);
  });
});
