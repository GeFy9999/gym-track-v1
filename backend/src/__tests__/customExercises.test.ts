import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({}) };
  },
}));

// Custom exercises (created from the import screen) belong to their creator:
// they must never show up in, or be usable from, another user's account.

let muscleGroupId: string;

beforeAll(async () => {
  const group = await prisma.muscleGroup.create({
    data: { name: `CustomGroup_${Date.now()}` },
  });
  muscleGroupId = group.id;
  await prisma.exercise.create({
    data: { name: "Built-in Curl", muscleGroupId },
  });
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function createCustom(token: string, name: string) {
  const res = await request(app)
    .post("/api/exercises")
    .set(auth(token))
    .send({ name, muscleGroupId });
  expect(res.status).toBe(201);
  return res.body.id as string;
}

describe("custom exercises", () => {
  it("only appear in their creator's catalog", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const customId = await createCustom(owner.token, "Owner Private Press");

    const mine = await request(app).get("/api/exercises").set(auth(owner.token));
    const theirs = await request(app).get("/api/exercises").set(auth(other.token));
    const ids = (res: request.Response) =>
      (res.body as { id: string }[]).map((e) => e.id);

    expect(ids(mine)).toContain(customId);
    expect(ids(theirs)).not.toContain(customId);
    // Built-ins are still shared by everyone.
    const names = (theirs.body as { name: string }[]).map((e) => e.name);
    expect(names).toContain("Built-in Curl");

    const byGroup = await request(app)
      .get(`/api/exercises?muscleGroupId=${muscleGroupId}`)
      .set(auth(other.token));
    expect(ids(byGroup)).not.toContain(customId);

    // The owner id is never sent back.
    const own = (mine.body as { id: string; userId?: string }[]).find(
      (e) => e.id === customId,
    );
    expect(own?.userId).toBeUndefined();
  });

  it("can't be added to another user's session or import", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const customId = await createCustom(owner.token, "Owner Secret Row");

    const session = await request(app)
      .post("/api/sessions")
      .set(auth(other.token))
      .send({ muscleGroup: "Chest" });
    const add = await request(app)
      .post("/api/session-exercises")
      .set(auth(other.token))
      .send({ sessionId: session.body.id, exerciseId: customId });
    expect(add.status).toBe(404);

    const imported = await request(app)
      .post("/api/import")
      .set(auth(other.token))
      .send({
        workouts: [
          {
            date: "2026-01-05T10:00:00.000Z",
            muscleGroup: "Chest",
            exercises: [
              { exerciseId: customId, sets: [{ weight: 50, reps: 5, unit: "kg" }] },
            ],
          },
        ],
      });
    expect(imported.status).toBe(400);

    // …while the owner can use it normally.
    const ownSession = await request(app)
      .post("/api/sessions")
      .set(auth(owner.token))
      .send({ muscleGroup: "Chest" });
    const ownAdd = await request(app)
      .post("/api/session-exercises")
      .set(auth(owner.token))
      .send({ sessionId: ownSession.body.id, exerciseId: customId });
    expect(ownAdd.status).toBe(201);
  });

  it("are deleted with their owner's account", async () => {
    const owner = await registerUser();
    const customId = await createCustom(owner.token, "Doomed Exercise");

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(await prisma.exercise.findUnique({ where: { id: customId } })).toBeNull();
  });
});
