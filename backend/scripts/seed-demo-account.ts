// LOCAL ONLY: creates (or recreates) a demo account full of realistic data —
// ~6 weeks of past workouts with progressive overload, body weight
// tracking, personal records and notes — for screenshots and demos.
//
// Run with: npx tsx scripts/seed-demo-account.ts
// Log in with: demo@gymstrack.local / Demo1234!
//
// Re-running wipes and regenerates the demo account's data (dates are always
// relative to today). Refuses to run against the production database.
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";

const EMAIL = "demo@gymstrack.local";
const PASSWORD = "Demo1234!";
const WEEKS_BACK = 6;

// Deterministic randomness, so every run looks the same.
let seed = 42;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(values: T[]): T => values[Math.floor(random() * values.length)]!;
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

type Lift = {
  name: string;
  start: number; // lb, week 0 (0 = bodyweight)
  perWeek: number; // lb added each week
  sets: number;
  reps: number[]; // typical reps per working set
  warmup?: boolean;
};

// Muscle group → its exercises. Group names match the app's muscle groups.
const PROGRAM: Record<string, Lift[]> = {
  Chest: [
    { name: "Barbell Bench Press", start: 155, perWeek: 5, sets: 4, reps: [8, 8, 7, 6], warmup: true },
    { name: "Dumbbell Incline Bench Press", start: 50, perWeek: 2.5, sets: 3, reps: [10, 10, 9] },
    { name: "Seated Machine Chest Fly", start: 90, perWeek: 5, sets: 3, reps: [12, 12, 11] },
    { name: "Chest Dip", start: 0, perWeek: 0, sets: 3, reps: [10, 9, 8] },
  ],
  Triceps: [
    { name: "Cable Rope Triceps Pushdown", start: 50, perWeek: 2.5, sets: 3, reps: [12, 12, 10] },
    { name: "Barbell Skull Crusher", start: 60, perWeek: 2.5, sets: 3, reps: [10, 10, 9] },
  ],
  Dos: [
    { name: "Barbell Deadlift", start: 225, perWeek: 10, sets: 3, reps: [5, 5, 5], warmup: true },
    { name: "Wide-Grip Cable Lat Pulldown", start: 130, perWeek: 5, sets: 4, reps: [10, 10, 9, 8] },
    { name: "Seated Cable Row With V-Handle", start: 120, perWeek: 5, sets: 3, reps: [10, 10, 10] },
    { name: "Overhand Pull-Up", start: 0, perWeek: 0, sets: 3, reps: [8, 7, 6] },
  ],
  Biceps: [
    { name: "Barbell Curl", start: 65, perWeek: 2.5, sets: 3, reps: [10, 10, 8] },
    { name: "Dumbbell Alternating Hammer Curl", start: 30, perWeek: 2.5, sets: 3, reps: [12, 12, 10] },
  ],
  Legs: [
    { name: "Barbell High-Bar Back Squat", start: 185, perWeek: 5, sets: 4, reps: [8, 8, 7, 6], warmup: true },
    { name: "45-Degree Sled Leg Press", start: 270, perWeek: 10, sets: 3, reps: [12, 12, 10] },
    { name: "Seated Machine Leg Extension", start: 100, perWeek: 5, sets: 3, reps: [12, 12, 12] },
    { name: "Lying Machine Leg Curl", start: 80, perWeek: 5, sets: 3, reps: [12, 12, 10] },
    { name: "Barbell Standing Calf Raise", start: 135, perWeek: 5, sets: 4, reps: [15, 15, 12, 12] },
  ],
  Épaules: [
    { name: "Seated Barbell Overhead Press", start: 95, perWeek: 2.5, sets: 4, reps: [8, 8, 7, 6], warmup: true },
    { name: "Dumbbell Lateral Raise", start: 20, perWeek: 1.25, sets: 3, reps: [15, 14, 12] },
    { name: "Cable Rope Face Pull", start: 40, perWeek: 2.5, sets: 3, reps: [15, 15, 15] },
  ],
  Trapèze: [{ name: "Barbell Shrug", start: 185, perWeek: 5, sets: 3, reps: [12, 12, 10] }],
  Abdominaux: [
    { name: "Hanging Bent-Knee Raise", start: 0, perWeek: 0, sets: 3, reps: [15, 12, 12] },
    { name: "Bicycle Crunch", start: 0, perWeek: 0, sets: 3, reps: [20, 20, 18] },
  ],
  "Avant-bras": [{ name: "Seated Cable Wrist Curl", start: 40, perWeek: 2.5, sets: 3, reps: [15, 15, 12] }],
};

// Weekday (0 = Monday) → muscle groups trained that day.
const WEEK_PLAN: Record<number, string[]> = {
  0: ["Chest", "Triceps"],
  1: ["Dos", "Biceps"],
  3: ["Legs"],
  4: ["Épaules", "Trapèze"],
  5: ["Abdominaux", "Avant-bras"],
};

const TRACKED = [
  "Barbell Bench Press",
  "Barbell High-Bar Back Squat",
  "Barbell Deadlift",
  "Seated Barbell Overhead Press",
  "Barbell Curl",
  "Wide-Grip Cable Lat Pulldown",
];

const NOTES: Record<string, string> = {
  "Barbell Bench Press": "Omoplates serrées, pieds bien ancrés au sol. Descendre la barre au bas des pecs.",
  "Barbell High-Bar Back Squat": "Descendre sous la parallèle, genoux dans l'axe des pieds.",
  "Barbell Deadlift": "Dos neutre, pousser le sol avec les jambes avant de tirer.",
};

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NODE_ENV === "production" || url.includes("/app/data")) {
    throw new Error(`Refusing to seed demo data into what looks like production (${url}).`);
  }
}

async function main() {
  assertLocalDatabase();

  // Resolve every exercise by name up front — fail loudly on a typo.
  const names = Object.values(PROGRAM).flat().map((l) => l.name);
  const exercises = await prisma.exercise.findMany({
    where: { name: { in: names }, isCustom: false },
    select: { id: true, name: true },
  });
  const exerciseId = new Map(exercises.map((e) => [e.name, e.id]));
  const missing = names.filter((n) => !exerciseId.has(n));
  if (missing.length) {
    throw new Error(`Missing exercises (run the ExerciseDB import first?): ${missing.join(", ")}`);
  }

  // Start from scratch on every run.
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    const where = { userId: existing.id };
    await prisma.set.deleteMany({ where: { sessionExercise: { session: where } } });
    await prisma.sessionExercise.deleteMany({ where: { session: where } });
    await prisma.session.deleteMany({ where });
    await prisma.bodyWeight.deleteMany({ where });
    await prisma.trackedExercise.deleteMany({ where });
    await prisma.exerciseNote.deleteMany({ where });
    await prisma.exerciseLoadingType.deleteMany({ where });
    await prisma.progressPhoto.deleteMany({ where });
    await prisma.schedule.deleteMany({ where });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      name: "Alex Tremblay",
      createdAt: new Date(now.getTime() - (WEEKS_BACK * 7 + 3) * 86400_000),
      emailVerified: true,
      language: "fr",
      weightUnit: "lb",
      restTimerEnabled: true,
      restTimerSeconds: 120,
      barbellModeEnabled: true,
      // Pro, annual, one renewal in: shows the loyalty card too.
      isPro: true,
      billingProvider: "stripe",
      proInterval: "year",
      proCurrentPeriodEnd: new Date(now.getTime() + 240 * 86400_000),
      loyaltyPeriodsPaid: 1,
      hasUsedTrial: true,
    },
  });

  // Monday of the current week, local time.
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  let sessionCount = 0;
  let setCount = 0;

  for (let week = -WEEKS_BACK; week <= 0; week++) {
    const progress = week + WEEKS_BACK; // 0 … WEEKS_BACK
    for (const [weekdayText, groups] of Object.entries(WEEK_PLAN)) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + week * 7 + Number(weekdayText));
      // Only days already past (today included only if it's evening already).
      const workoutStart = new Date(day);
      workoutStart.setHours(17, 30 + Math.floor(random() * 50), 0, 0);
      if (workoutStart > now) continue;
      // Real life: the odd missed day (never in the current week).
      if (week < 0 && random() < 0.1) continue;

      const durationMinutes = 50 + Math.floor(random() * 30);
      for (const [i, group] of groups.entries()) {
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            muscleGroup: group,
            completed: true,
            date: new Date(workoutStart.getTime() + i * 25 * 60_000),
            durationMinutes,
          },
        });
        sessionCount++;

        for (const [order, lift] of PROGRAM[group]!.entries()) {
          const sessionExercise = await prisma.sessionExercise.create({
            data: { sessionId: session.id, exerciseId: exerciseId.get(lift.name)!, order },
          });

          const working =
            lift.start === 0 ? 0 : roundTo(lift.start + lift.perWeek * progress, 2.5);
          const sets: { weight: number; reps: number; type: string }[] = [];
          if (lift.warmup) {
            sets.push({ weight: roundTo(working * 0.6, 5), reps: 10, type: "warmup" });
          }
          for (let s = 0; s < lift.sets; s++) {
            // Reps creep up a little over the weeks, with some day-to-day noise.
            const reps = lift.reps[s]! + (progress >= 4 ? 1 : 0) + pick([-1, 0, 0, 0, 1]);
            sets.push({ weight: working, reps: Math.max(1, reps), type: "normal" });
          }

          await prisma.set.createMany({
            data: sets.map((s) => ({
              sessionExerciseId: sessionExercise.id,
              weight: s.weight,
              reps: s.reps,
              unit: "lb",
              completed: true,
              type: s.type,
            })),
          });
          setCount += sets.length;
        }
      }
    }
  }

  // Body weight every 3–4 days, trending down ~6 lb with daily noise.
  const firstDay = new Date(monday);
  firstDay.setDate(monday.getDate() - WEEKS_BACK * 7);
  const totalDays = Math.round((now.getTime() - firstDay.getTime()) / 86400_000);
  let weightCount = 0;
  for (let d = 0; d <= totalDays; d += pick([3, 3, 4])) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + d);
    date.setHours(7, 30, 0, 0);
    if (date > now) break;
    const trend = 184.5 - (6 * d) / totalDays;
    await prisma.bodyWeight.create({
      data: {
        userId: user.id,
        value: Math.round((trend + (random() - 0.5) * 1.4) * 10) / 10,
        date,
      },
    });
    weightCount++;
  }

  await prisma.trackedExercise.createMany({
    data: TRACKED.map((name) => ({ userId: user.id, exerciseId: exerciseId.get(name)! })),
  });
  await prisma.exerciseNote.createMany({
    data: Object.entries(NOTES).map(([name, note]) => ({
      userId: user.id,
      exerciseId: exerciseId.get(name)!,
      note,
    })),
  });

  console.log(
    `✅ Demo account ready: ${sessionCount} sessions, ${setCount} sets, ${weightCount} body weight entries, ${TRACKED.length} tracked records.`,
  );
  console.log(`   Log in with ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
