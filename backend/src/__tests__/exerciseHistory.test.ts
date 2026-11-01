import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

// A user with sessions of one exercise already in the database, as for an
// account that existed before the weight chart did.
async function userWithHistory(isPro: boolean) {
  const u = await registerUser();
  if (isPro) {
    await prisma.user.update({ where: { id: u.user.id }, data: { isPro: true } });
  }
  const group = await prisma.muscleGroup.create({
    data: { name: `HistoryGroup_${Date.now()}_${Math.random()}` },
  });
  const exercise = await prisma.exercise.create({
    data: { name: "Barbell Shrug", muscleGroupId: group.id },
  });

  const logSession = (
    date: Date,
    sets: { weight: number; reps: number; type?: string }[],
    completed = true,
  ) =>
    prisma.session.create({
      data: {
        userId: u.user.id,
        muscleGroup: group.name,
        completed,
        date,
        sessionExercises: {
          create: {
            exerciseId: exercise.id,
            sets: { create: sets.map((s) => ({ ...s, completed: true })) },
          },
        },
      },
    });

  const sessions = {
    old: daysAgo(200),
    older: daysAgo(150),
    mid: daysAgo(30),
    recent: daysAgo(10),
  };
  await logSession(sessions.old, [{ weight: 15, reps: 10 }]);
  await logSession(sessions.older, [{ weight: 20, reps: 10 }]);
  await logSession(sessions.recent, [
    { weight: 20, reps: 10, type: "warmup" },
    { weight: 30, reps: 8 },
    { weight: 25, reps: 10 },
  ]);
  await logSession(sessions.mid, [{ weight: 25, reps: 10 }]);
  // Warm-ups only: nothing to chart.
  await logSession(daysAgo(5), [{ weight: 50, reps: 5, type: "warmup" }]);
  // Not finished yet: not part of the history.
  await logSession(daysAgo(1), [{ weight: 99, reps: 1 }], false);

  const res = await request(app)
    .get(`/api/sessions/me/exercise-history/${exercise.id}`)
    .set("Authorization", `Bearer ${u.token}`);
  return { res, sessions };
}

describe("exercise history: weight over time", () => {
  it("charts the heaviest working set of every past session for Pro, oldest first", async () => {
    const { res, sessions } = await userWithHistory(true);

    expect(res.status).toBe(200);
    expect(res.body.records.weightOverTime).toEqual([
      { date: sessions.old.toISOString(), weight: 15 },
      { date: sessions.older.toISOString(), weight: 20 },
      { date: sessions.mid.toISOString(), weight: 25 },
      { date: sessions.recent.toISOString(), weight: 30 },
    ]);
    expect(res.body.records.weightOverTimeLockedCount).toBe(0);
  });

  it("only sends a free user the last 90 days, and how many older points there are", async () => {
    const { res, sessions } = await userWithHistory(false);

    expect(res.status).toBe(200);
    expect(res.body.records.weightOverTime).toEqual([
      { date: sessions.mid.toISOString(), weight: 25 },
      { date: sessions.recent.toISOString(), weight: 30 },
    ]);
    expect(res.body.records.weightOverTimeLockedCount).toBe(2);
  });

  it("doesn't send a free user the Pro-only charts' real data", async () => {
    const free = await userWithHistory(false);
    expect(free.res.body.records.byReps).toEqual([]);
    expect(free.res.body.records.volumeOverTime).toEqual([]);
    expect(free.res.body.records.oneRepMaxOverTime).toEqual([]);

    const pro = await userWithHistory(true);
    expect(pro.res.body.records.byReps.length).toBeGreaterThan(0);
    expect(pro.res.body.records.volumeOverTime.length).toBeGreaterThan(0);
    expect(pro.res.body.records.oneRepMaxOverTime.length).toBeGreaterThan(0);
  });
});
