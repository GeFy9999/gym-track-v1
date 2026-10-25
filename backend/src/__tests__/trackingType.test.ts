import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { trackingTypeFor, type ExerciseDbEntry } from "../services/exerciseDb.js";
import { registerUser } from "./helpers.js";

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({}) };
  },
}));

const entry = (overrides: Partial<ExerciseDbEntry>): ExerciseDbEntry => ({
  id: "0001",
  name: "x",
  bodyPart: "x",
  equipment: "barbell",
  target: "pectorals",
  secondaryMuscles: [],
  instructions: [],
  description: "",
  ...overrides,
});

describe("catalog tracking type", () => {
  it("times cardio machines and running/walking cardio", () => {
    expect(trackingTypeFor(entry({ name: "treadmill running", equipment: "treadmill" }))).toBe("TIME");
    expect(trackingTypeFor(entry({ name: "stepmill stair climbing", equipment: "stepmill machine" }))).toBe("TIME");
    expect(trackingTypeFor(entry({ name: "upright stationary cycling", equipment: "stationary bike" }))).toBe("TIME");
    expect(
      trackingTypeFor(
        entry({ name: "running", equipment: "body weight", target: "cardiovascular system" }),
      ),
    ).toBe("TIME");
  });

  it("times static bodyweight holds, not their moving variants", () => {
    const bw = (name: string) => trackingTypeFor(entry({ name, equipment: "body weight" }));
    expect(bw("bench-supported side plank")).toBe("TIME");
    expect(bw("front lever hold")).toBe("TIME");
    expect(bw("floor L-sit hold")).toBe("TIME");
    expect(bw("German hang on rings")).toBe("TIME");
    expect(bw("plank shoulder tap")).toBe("REPS");
    expect(bw("side plank hip lift")).toBe("REPS");
    expect(bw("wall sit march")).toBe("REPS");
    expect(bw("burpee with plank jack")).toBe("REPS");
    // A weighted plank keeps its weight input.
    expect(trackingTypeFor(entry({ name: "weighted forearm plank", equipment: "weighted" }))).toBeNull();
  });

  it("logs bodyweight moves as reps only, but keeps weight for weighted ones", () => {
    expect(trackingTypeFor(entry({ name: "push-up", equipment: "body weight" }))).toBe("REPS");
    // Cardio that isn't running/walking (burpees…) is still counted in reps.
    expect(
      trackingTypeFor(
        entry({ name: "burpee", equipment: "body weight", target: "cardiovascular system" }),
      ),
    ).toBe("REPS");
    // "walking lunge" isn't cardio: reps, not time.
    expect(
      trackingTypeFor(entry({ name: "bodyweight walking lunge", equipment: "body weight", target: "quadriceps" })),
    ).toBe("REPS");
    expect(trackingTypeFor(entry({ name: "weighted pull-up", equipment: "weighted" }))).toBeNull();
    expect(trackingTypeFor(entry({ name: "bench press", equipment: "barbell" }))).toBeNull();
  });
});

describe("timed sets", () => {
  let exerciseId: string;

  beforeAll(async () => {
    const group = await prisma.muscleGroup.create({
      data: { name: `Cardio_${Date.now()}` },
    });
    const exercise = await prisma.exercise.create({
      data: { name: "Treadmill", muscleGroupId: group.id, trackingType: "TIME" },
    });
    exerciseId = exercise.id;
  });

  it("stores a duration, rounded and bounded", async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };
    const session = await request(app).post("/api/sessions").set(auth).send({ muscleGroup: "Legs" });
    const se = await request(app)
      .post("/api/session-exercises")
      .set(auth)
      .send({ sessionId: session.body.id, exerciseId });

    const created = await request(app)
      .post("/api/sets")
      .set(auth)
      .send({ sessionExerciseId: se.body.id, weight: 0, reps: 0, durationSeconds: 750.4 });
    expect(created.status).toBe(201);
    expect(created.body.durationSeconds).toBe(750);

    const updated = await request(app)
      .patch(`/api/sets/${created.body.id}`)
      .set(auth)
      .send({ durationSeconds: 10_000_000 });
    expect(updated.body.durationSeconds).toBe(86_400);

    const read = await request(app).get(`/api/sessions/${session.body.id}`).set(auth);
    expect(read.body.sessionExercises[0].exercise.trackingType).toBe("TIME");
  });
});
