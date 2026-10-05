import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

let exerciseId: string;

beforeAll(async () => {
  const muscleGroup = await prisma.muscleGroup.create({
    data: { name: `LoadingGroup_${Date.now()}` },
  });
  const exercise = await prisma.exercise.create({
    data: { name: "Lever Chest Press", muscleGroupId: muscleGroup.id },
  });
  exerciseId = exercise.id;
});

async function proUser() {
  const u = await registerUser();
  await prisma.user.update({ where: { id: u.user.id }, data: { isPro: true } });
  return u;
}

const put = (token: string, body: object) =>
  request(app)
    .put("/api/exercise-loading-types")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const list = (token: string) =>
  request(app)
    .get("/api/exercise-loading-types")
    .set("Authorization", `Bearer ${token}`);

describe("per-user exercise loading type", () => {
  it("lets a Pro user set, read back and reset their loading type", async () => {
    const { token } = await proUser();

    const setRes = await put(token, { exerciseId, loadingType: "MACHINE" });
    expect(setRes.status).toBe(200);
    expect((await list(token)).body).toEqual([
      { exerciseId, loadingType: "MACHINE" },
    ]);

    const resetRes = await put(token, { exerciseId, loadingType: null });
    expect(resetRes.status).toBe(200);
    expect((await list(token)).body).toEqual([]);
  });

  it("keeps each user's choice separate", async () => {
    const a = await proUser();
    const b = await proUser();
    await put(a.token, { exerciseId, loadingType: "PLATE_LOADED" });

    expect((await list(b.token)).body).toEqual([]);
  });

  it("rejects an unknown loading type", async () => {
    const { token } = await proUser();
    const res = await put(token, { exerciseId, loadingType: "ROCKET" });
    expect(res.status).toBe(400);
  });

  it("is Pro-only", async () => {
    const { token } = await registerUser();
    const res = await put(token, { exerciseId, loadingType: "MACHINE" });
    expect(res.status).toBe(403);
    expect(res.body.proRequired).toBe(true);
  });

  it("doesn't block deleting an account that has a loading type saved", async () => {
    const { token } = await proUser();
    await put(token, { exerciseId, loadingType: "MACHINE" });

    const res = await request(app)
      .delete("/api/auth/delete-account")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
