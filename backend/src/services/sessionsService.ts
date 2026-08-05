import {
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
