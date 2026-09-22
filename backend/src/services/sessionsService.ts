import {
  getAllUserSessions,
  getSessionById,
  getSessionsForUser,
  insertSession,
  insertSessionExercise,
  updateSession,
} from "../repositories/databaseRepository.js";
import { prisma } from "../prisma.js";

// Récupère une session par son id
export async function getSession(sessionId: string) {
  return await getSessionById(sessionId);
}

// Récupère les sessions d'un user entre deux dates
export async function getUserSessions(userId: string, start: Date, end: Date) {
  return await getSessionsForUser(userId, start, end);
}

// Crée une nouvelle session et copie les exercices de la dernière session complétée
export async function createSession(session: {
  userId: string;
  muscleGroup: string;
}) {
  const newSession = await insertSession(session);

  // Find the most recent completed session for this user + muscle group
  const lastSession = await prisma.session.findFirst({
    where: {
      userId: session.userId,
      muscleGroup: session.muscleGroup,
      completed: true,
    },
    orderBy: { date: "desc" },
    include: {
      sessionExercises: true,
    },
  });

  // Copy exercises (without sets) to the new session
  if (lastSession && lastSession.sessionExercises.length > 0) {
    for (const se of lastSession.sessionExercises) {
      await insertSessionExercise({
        sessionId: newSession.id,
        exerciseId: se.exerciseId,
      });
    }
  }

  // Return the new session with exercises included
  return await getSessionById(newSession.id);
}

// Marque une session comme complétée
export async function completeSession(sessionId: string) {
  return await updateSession(sessionId, { completed: true });
}

export async function getUserPersonalRecords(userId: string) {
  const sessions = await getAllUserSessions(userId);

  const records: {
    [exerciseName: string]: { weight: number; exerciseId: string };
  } = {};

  for (const session of sessions) {
    for (const se of session.sessionExercises) {
      for (const set of se.sets) {
        if (set.type === "warmup") continue;
        const name = se.exercise.name;
        if (!records[name] || set.weight > records[name].weight) {
          records[name] = { weight: set.weight, exerciseId: se.exercise.id };
        }
      }
    }
  }

  return Object.entries(records).map(([name, data]) => ({
    name,
    weight: data.weight,
    exerciseId: data.exerciseId,
  }));
}

export async function getUserMuscleVolume(userId: string) {
  const sessions = await getAllUserSessions(userId);

  const volume: { [muscleGroup: string]: number } = {};

  for (const session of sessions) {
    const group = session.muscleGroup;
    for (const se of session.sessionExercises) {
      const workingSets = se.sets.filter((s) => s.type !== "warmup").length;
      volume[group] = (volume[group] || 0) + workingSets;
    }
  }

  const maxVolume = Math.max(...Object.values(volume), 1);

  return Object.entries(volume)
    .map(([name, sets]) => ({
      name,
      sets,
      percentage: Math.round((sets / maxVolume) * 100),
    }))
    .sort((a, b) => b.sets - a.sets);
}

// Epley formula: estimates the 1-rep max from any set's weight/reps.
const estimateOneRepMax = (weight: number, reps: number) =>
  weight * (1 + reps / 30);

export async function getUserExerciseProgress(
  userId: string,
  exerciseId: string,
) {
  const sessions = await getAllUserSessions(userId);

  const weeklyMax: { [weekLabel: string]: number } = {};

  for (const session of sessions) {
    for (const se of session.sessionExercises) {
      if (se.exerciseId !== exerciseId) continue;

      const date = new Date(session.date);
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      const label = monday.toISOString().slice(0, 10);

      for (const set of se.sets) {
        if (set.type === "warmup") continue;
        if (set.weight <= 0 || set.reps <= 0) continue;
        const oneRepMax = estimateOneRepMax(set.weight, set.reps);
        if (!weeklyMax[label] || oneRepMax > weeklyMax[label]) {
          weeklyMax[label] = oneRepMax;
        }
      }
    }
  }

  return Object.entries(weeklyMax)
    .map(([week, oneRepMax]) => ({
      week,
      oneRepMax: Math.round(oneRepMax * 10) / 10,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

const hasSetData = (s: { weight: number; reps: number }) =>
  s.weight > 0 || s.reps > 0;

// Per-exercise summary (session count + last time done) for the exercise
// list page — avoids the frontend firing one request per exercise.
export async function getUserExerciseStats(userId: string) {
  const sessions = await getAllUserSessions(userId);

  const statsByExercise: Record<string, { sessionCount: number; lastDate: Date }> =
    {};

  for (const session of sessions) {
    if (!session.completed) continue;

    const exerciseIdsInSession = new Set<string>();
    for (const se of session.sessionExercises) {
      if (se.sets.some(hasSetData)) exerciseIdsInSession.add(se.exercise.id);
    }

    for (const exerciseId of exerciseIdsInSession) {
      const existing = statsByExercise[exerciseId];
      if (!existing) {
        statsByExercise[exerciseId] = {
          sessionCount: 1,
          lastDate: session.date,
        };
      } else {
        existing.sessionCount += 1;
        if (session.date > existing.lastDate) {
          existing.lastDate = session.date;
        }
      }
    }
  }

  return Object.entries(statsByExercise).map(([exerciseId, stats]) => ({
    exerciseId,
    sessionCount: stats.sessionCount,
    lastDate: stats.lastDate.toISOString(),
  }));
}

// Full history + computed records for a single exercise, for the exercise
// detail page.
export async function getUserExerciseHistory(userId: string, exerciseId: string) {
  const sessions = await getAllUserSessions(userId);

  const history = sessions
    .filter((s) => s.completed)
    .flatMap((session) => {
      const se = session.sessionExercises.find(
        (se) => se.exercise.id === exerciseId,
      );
      if (!se) return [];
      const sets = se.sets.filter(hasSetData);
      if (sets.length === 0) return [];
      return [
        {
          sessionId: session.id,
          date: session.date,
          muscleGroup: session.muscleGroup,
          sets: sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            unit: s.unit,
            type: s.type,
          })),
        },
      ];
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  let bestWeight: { weight: number; date: Date } | null = null;
  let bestVolume: {
    weight: number;
    reps: number;
    volume: number;
    date: Date;
  } | null = null;
  let bestOneRepMax: {
    weight: number;
    reps: number;
    oneRepMax: number;
    date: Date;
  } | null = null;
  const bestByReps: Record<number, number> = {};

  for (const entry of history) {
    for (const set of entry.sets) {
      if (set.type === "warmup" || set.weight <= 0) continue;

      if (!bestWeight || set.weight > bestWeight.weight) {
        bestWeight = { weight: set.weight, date: entry.date };
      }

      const volume = set.weight * set.reps;
      if (!bestVolume || volume > bestVolume.volume) {
        bestVolume = { weight: set.weight, reps: set.reps, volume, date: entry.date };
      }

      if (set.reps > 0) {
        const oneRepMax = estimateOneRepMax(set.weight, set.reps);
        if (!bestOneRepMax || oneRepMax > bestOneRepMax.oneRepMax) {
          bestOneRepMax = {
            weight: set.weight,
            reps: set.reps,
            oneRepMax: Math.round(oneRepMax * 10) / 10,
            date: entry.date,
          };
        }
        const bestForReps = bestByReps[set.reps];
        if (!bestForReps || set.weight > bestForReps) {
          bestByReps[set.reps] = set.weight;
        }
      }
    }
  }

  const volumeOverTime = history
    .map((entry) => {
      const volume = entry.sets
        .filter((s) => s.type !== "warmup")
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
      return { date: entry.date, volume: Math.round(volume) };
    })
    .filter((p) => p.volume > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const oneRepMaxOverTime = history
    .map((entry) => {
      const working = entry.sets.filter(
        (s) => s.type !== "warmup" && s.weight > 0 && s.reps > 0,
      );
      if (working.length === 0) return null;
      const best = Math.max(
        ...working.map((s) => estimateOneRepMax(s.weight, s.reps)),
      );
      return { date: entry.date, oneRepMax: Math.round(best * 10) / 10 };
    })
    .filter((p): p is { date: Date; oneRepMax: number } => p !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    history: history.map((entry) => ({
      ...entry,
      date: entry.date.toISOString(),
    })),
    records: {
      bestWeight: bestWeight && { ...bestWeight, date: bestWeight.date.toISOString() },
      bestVolume: bestVolume && { ...bestVolume, date: bestVolume.date.toISOString() },
      bestOneRepMax:
        bestOneRepMax && { ...bestOneRepMax, date: bestOneRepMax.date.toISOString() },
      byReps: Object.entries(bestByReps)
        .map(([reps, weight]) => ({ reps: Number(reps), weight }))
        .sort((a, b) => a.reps - b.reps),
      volumeOverTime: volumeOverTime.map((p) => ({
        ...p,
        date: p.date.toISOString(),
      })),
      oneRepMaxOverTime: oneRepMaxOverTime.map((p) => ({
        ...p,
        date: p.date.toISOString(),
      })),
    },
  };
}
