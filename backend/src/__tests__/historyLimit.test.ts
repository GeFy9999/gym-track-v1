import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

// Free users only get the last 90 days of history. GET /sessions/:id must
// enforce the same limit as GET /sessions/me, otherwise an old session's id
// (e.g. from an exercise's history list) would expose it in full.

const DAY = 24 * 60 * 60 * 1000;

async function createSession(
  userId: string,
  daysAgo: number,
  completed: boolean,
) {
  return prisma.session.create({
    data: {
      userId,
      muscleGroup: "Back",
      date: new Date(Date.now() - daysAgo * DAY),
      completed,
    },
  });
}

describe("free plan 90-day history limit on GET /sessions/:id", () => {
  it("blocks a free user from reading a completed session older than 90 days", async () => {
    const { token, user } = await registerUser();
    const old = await createSession(user.id, 120, true);

    const res = await request(app)
      .get(`/api/sessions/${old.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.proRequired).toBe(true);
  });

  it("still lets a free user read recent or unfinished sessions", async () => {
    const { token, user } = await registerUser();
    const recent = await createSession(user.id, 10, true);
    const oldUnfinished = await createSession(user.id, 120, false);

    for (const s of [recent, oldUnfinished]) {
      const res = await request(app)
        .get(`/api/sessions/${s.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it("lets a Pro user read a completed session older than 90 days", async () => {
    const { token, user } = await registerUser();
    await prisma.user.update({ where: { id: user.id }, data: { isPro: true } });
    const old = await createSession(user.id, 120, true);

    const res = await request(app)
      .get(`/api/sessions/${old.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
