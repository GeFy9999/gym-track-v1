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
