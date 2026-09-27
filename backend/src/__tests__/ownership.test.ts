import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

// These tests cover the IDOR fixes from the security pass: a logged-in user
// must never be able to read/mutate another user's resources by guessing or
// reusing an ID. A mismatch should read back as 404 (not 403), so a resource
// belonging to someone else doesn't even reveal that it exists.

let exerciseId: string;

beforeAll(async () => {
  const muscleGroup = await prisma.muscleGroup.create({
    data: { name: `TestGroup_${Date.now()}` },
  });
  const exercise = await prisma.exercise.create({
    data: { name: "Test Exercise", muscleGroupId: muscleGroup.id },
  });
  exerciseId = exercise.id;
});

function authedRequest(token: string) {
  return {
    get: (url: string) =>
      request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url: string, body: object) =>
      request(app)
        .post(url)
        .set("Authorization", `Bearer ${token}`)
        .send(body),
    delete: (url: string) =>
      request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
}

describe("session ownership", () => {
  it("blocks another user from reading or deleting a session they don't own", async () => {
    const owner = await registerUser();
    const intruder = await registerUser();

    const createRes = await authedRequest(owner.token).post("/api/sessions", {
      muscleGroup: "Chest",
    });
    expect(createRes.status).toBe(201);
    const sessionId = createRes.body.id;

    const readAsIntruder = await authedRequest(intruder.token).get(
      `/api/sessions/${sessionId}`,
    );
    expect(readAsIntruder.status).toBe(404);

    const deleteAsIntruder = await authedRequest(intruder.token).delete(
      `/api/sessions/${sessionId}`,
    );
    expect(deleteAsIntruder.status).toBe(404);

    // The owner can still read their own session — confirms the 404 above
    // was an ownership check, not a bug that broke the route entirely.
    const readAsOwner = await authedRequest(owner.token).get(
      `/api/sessions/${sessionId}`,
    );
    expect(readAsOwner.status).toBe(200);
  });

  it("rejects session routes with no auth token at all", async () => {
    const res = await request(app).get("/api/sessions/me");
    expect(res.status).toBe(401);
  });
});

describe("session-exercise ownership", () => {
  it("blocks another user from attaching an exercise to someone else's session", async () => {
    const owner = await registerUser();
    const intruder = await registerUser();

    const createRes = await authedRequest(owner.token).post("/api/sessions", {
      muscleGroup: "Back",
    });
    const sessionId = createRes.body.id;

    const res = await authedRequest(intruder.token).post(
      "/api/session-exercises",
      { sessionId, exerciseId },
    );
    expect(res.status).toBe(404);
  });
});

describe("tracked-exercise ownership", () => {
  it("does not let a user delete another user's tracked exercise", async () => {
    const owner = await registerUser();
    const intruder = await registerUser();

    const trackRes = await authedRequest(owner.token).post(
      "/api/tracked-exercises",
      { exerciseId },
    );
    expect(trackRes.status).toBe(201);
    const trackedId = trackRes.body.id;

    const deleteAsIntruder = await authedRequest(intruder.token).delete(
      `/api/tracked-exercises/${trackedId}`,
    );
    expect(deleteAsIntruder.status).toBe(404);

    const stillThere = await prisma.trackedExercise.findUnique({
      where: { id: trackedId },
    });
    expect(stillThere).not.toBeNull();
  });
});
