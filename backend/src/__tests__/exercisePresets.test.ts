import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

let groupName: string;
let otherGroupName: string;
let benchId: string;
let flyId: string;
let squatId: string;

beforeAll(async () => {
  const group = await prisma.muscleGroup.create({
    data: { name: `PresetGroup_${Date.now()}` },
  });
  const other = await prisma.muscleGroup.create({
    data: { name: `PresetOther_${Date.now()}` },
  });
  groupName = group.name;
  otherGroupName = other.name;
  benchId = (
    await prisma.exercise.create({
      data: { name: "Bench Press", muscleGroupId: group.id },
    })
  ).id;
  flyId = (
    await prisma.exercise.create({
      data: { name: "Cable Fly", muscleGroupId: group.id },
    })
  ).id;
  squatId = (
    await prisma.exercise.create({
      data: { name: "Squat", muscleGroupId: other.id },
    })
  ).id;
});

const create = (token: string, body: object) =>
  request(app)
    .post("/api/exercise-presets")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const list = (token: string, muscleGroup?: string) =>
  request(app)
    .get("/api/exercise-presets")
    .query(muscleGroup ? { muscleGroup } : {})
    .set("Authorization", `Bearer ${token}`);

describe("exercise presets", () => {
  it("creates a preset and lists it with its exercises in order", async () => {
    const { token } = await registerUser();
    const res = await create(token, {
      name: "Push A",
      muscleGroup: groupName,
      exerciseIds: [flyId, benchId],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Push A");
    expect(res.body.exercises.map((e: { id: string }) => e.id)).toEqual([
      flyId,
      benchId,
    ]);

    const listed = await list(token, groupName);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(res.body.id);
    expect((await list(token, otherGroupName)).body).toEqual([]);
  });

  it("renames and replaces the exercise list", async () => {
    const { token } = await registerUser();
    const { body: preset } = await create(token, {
      name: "Preset 1",
      muscleGroup: groupName,
      exerciseIds: [benchId],
    });

    const res = await request(app)
      .patch(`/api/exercise-presets/${preset.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Heavy day", exerciseIds: [benchId, flyId] });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Heavy day");
    expect(res.body.exercises.map((e: { id: string }) => e.id)).toEqual([
      benchId,
      flyId,
    ]);
  });

  it("rejects an exercise from another muscle group", async () => {
    const { token } = await registerUser();
    const res = await create(token, {
      name: "Mixed",
      muscleGroup: groupName,
      exerciseIds: [benchId, squatId],
    });
    expect(res.status).toBe(400);
  });

  it("rejects an empty name", async () => {
    const { token } = await registerUser();
    const res = await create(token, {
      name: "   ",
      muscleGroup: groupName,
      exerciseIds: [],
    });
    expect(res.status).toBe(400);
  });

  it("keeps each user's presets private", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const { body: preset } = await create(a.token, {
      name: "Mine",
      muscleGroup: groupName,
      exerciseIds: [benchId],
    });

    expect((await list(b.token)).body).toEqual([]);
    const patch = await request(app)
      .patch(`/api/exercise-presets/${preset.id}`)
      .set("Authorization", `Bearer ${b.token}`)
      .send({ name: "Stolen" });
    expect(patch.status).toBe(404);
    const del = await request(app)
      .delete(`/api/exercise-presets/${preset.id}`)
      .set("Authorization", `Bearer ${b.token}`);
    expect(del.status).toBe(404);
  });

  it("deletes a preset", async () => {
    const { token } = await registerUser();
    const { body: preset } = await create(token, {
      name: "Gone",
      muscleGroup: groupName,
      exerciseIds: [benchId],
    });
    const res = await request(app)
      .delete(`/api/exercise-presets/${preset.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect((await list(token)).body).toEqual([]);
  });

  it("doesn't block deleting an account that has presets", async () => {
    const { token } = await registerUser();
    await create(token, {
      name: "Keep",
      muscleGroup: groupName,
      exerciseIds: [benchId],
    });
    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
