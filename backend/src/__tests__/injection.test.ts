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

// Request bodies are JSON, so a field the code expects to be a string can
// arrive as an object. Passed straight into a Prisma `where`/`data`, such an
// object becomes a query operator ({ not: "" }) or a nested write
// ({ user: { update: … } }) — these tests pin down that neither works.

describe("prisma operator injection in auth tokens", () => {
  it("can't reset someone's password with an operator instead of the token", async () => {
    const victim = await registerUser();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: victim.email });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: { not: "" }, newPassword: "hacked-password-123" });
    expect(res.status).toBe(400);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: victim.email, password: "hacked-password-123" });
    expect(login.status).toBe(400);
  });

  it("can't get a login token for an unverified account with an operator", async () => {
    await registerUser(); // leaves a pending verification token
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: { not: "" } });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});

describe("mass assignment / nested writes", () => {
  let exerciseId: string;
  let muscleGroupId: string;

  beforeAll(async () => {
    const muscleGroup = await prisma.muscleGroup.create({
      data: { name: `InjGroup_${Date.now()}` },
    });
    muscleGroupId = muscleGroup.id;
    const exercise = await prisma.exercise.create({
      data: { name: "Inj Exercise", muscleGroupId },
    });
    exerciseId = exercise.id;
  });

  const isPro = async (userId: string) =>
    (await prisma.user.findUnique({ where: { id: userId } }))?.isPro;

  it("can't grant itself Pro through the schedule update", async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };
    await request(app)
      .post("/api/schedule")
      .set(auth)
      .send({ frequency: 3, days: "1,3,5" });

    await request(app)
      .put("/api/schedule/me")
      .set(auth)
      .send({ user: { update: { isPro: true } } });

    expect(await isPro(user.user.id)).toBe(false);
  });

  it("can't grant itself Pro through a set update", async () => {
    const user = await registerUser();
    const auth = { Authorization: `Bearer ${user.token}` };
    const session = await request(app)
      .post("/api/sessions")
      .set(auth)
      .send({ muscleGroup: "Chest" });
    const se = await request(app)
      .post("/api/session-exercises")
      .set(auth)
      .send({ sessionId: session.body.id, exerciseId });
    const set = await request(app)
      .post("/api/sets")
      .set(auth)
      .send({ sessionExerciseId: se.body.id, weight: 10, reps: 5 });

    await request(app)
      .patch(`/api/sets/${set.body.id}`)
      .set(auth)
      .send({
        sessionExercise: {
          update: { session: { update: { user: { update: { isPro: true } } } } },
        },
      });

    expect(await isPro(user.user.id)).toBe(false);
  });

  it("can't move its set into another user's session", async () => {
    const victim = await registerUser();
    const attacker = await registerUser();
    const vAuth = { Authorization: `Bearer ${victim.token}` };
    const aAuth = { Authorization: `Bearer ${attacker.token}` };

    const vSession = await request(app)
      .post("/api/sessions")
      .set(vAuth)
      .send({ muscleGroup: "Chest" });
    const vSe = await request(app)
      .post("/api/session-exercises")
      .set(vAuth)
      .send({ sessionId: vSession.body.id, exerciseId });

    const aSession = await request(app)
      .post("/api/sessions")
      .set(aAuth)
      .send({ muscleGroup: "Chest" });
    const aSe = await request(app)
      .post("/api/session-exercises")
      .set(aAuth)
      .send({ sessionId: aSession.body.id, exerciseId });
    const aSet = await request(app)
      .post("/api/sets")
      .set(aAuth)
      .send({ sessionExerciseId: aSe.body.id, weight: 999, reps: 1 });

    await request(app)
      .patch(`/api/sets/${aSet.body.id}`)
      .set(aAuth)
      .send({ sessionExerciseId: vSe.body.id });

    const moved = await prisma.set.findUnique({ where: { id: aSet.body.id } });
    expect(moved?.sessionExerciseId).toBe(aSe.body.id);
  });

  it("can't create a session that is already completed or backdated", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/sessions")
      .set({ Authorization: `Bearer ${user.token}` })
      .send({
        muscleGroup: "Chest",
        completed: true,
        date: "2020-01-01T00:00:00.000Z",
      });
    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false);
    expect(new Date(res.body.date).getFullYear()).not.toBe(2020);
  });

  it("only lets a custom exercise set its name and group", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/exercises")
      .set({ Authorization: `Bearer ${user.token}` })
      .send({
        name: "My exercise",
        muscleGroupId,
        isCustom: false,
        videoUrl: "https://evil.example/video.mp4",
        image: "https://evil.example/pixel.png",
        exerciseDbId: "0001",
      });
    expect(res.status).toBe(201);
    expect(res.body.isCustom).toBe(true);
    const row = await prisma.exercise.findUnique({
      where: { id: res.body.id },
      omit: { exerciseDbId: false },
    });
    expect(row?.videoUrl).toBeNull();
    expect(row?.image).toBeNull();
    expect(row?.exerciseDbId).toBeNull();
  });

  it("has no route for users to create muscle groups", async () => {
    const user = await registerUser();
    const res = await request(app)
      .post("/api/muscleGroups")
      .set({ Authorization: `Bearer ${user.token}` })
      .send({ name: "Spam", description: "x", image: "x" });
    expect(res.status).toBe(404);
  });
});
