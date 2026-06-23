import { prisma } from "../prisma.js";

export async function getSessionsForUser(userId: string, startDate: Date, endDate: Date) {
  return await prisma.session.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      sessionExercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

export async function getAllExercises() {
  return await prisma.exercise.findMany({
    include: {
      muscleGroup: true,
    },
  });
}

export async function insertExercise(exercise: { name: string; muscleGroupId: string; isCustom?: boolean }) {
  await prisma.exercise.create({
    data: exercise,
  });
}

export async function insertMuscleGroup(muscleGroup: { name: string; description: string; image: string }) {
  await prisma.muscleGroup.create({
    data: muscleGroup,
  });
}

export async function getExercisesByMuscleGroup(muscleGroupId: string) {
  return await prisma.exercise.findMany({
    where: { muscleGroupId },
    include: { muscleGroup: true },
  });
}

export async function getAllMuscleGroups() {
  return await prisma.muscleGroup.findMany();
}

export async function getScheduleByUserId(userId: string) {
  return await prisma.schedule.findUnique({
    where: { userId },
  });
}

export async function insertSchedule(schedule: { userId: string; frequency: number; days: string }) {
  return await prisma.schedule.create({
    data: schedule,
  });
}

export async function updateSchedule(userId: string, schedule: { frequency?: number; days?: string }) {
  return await prisma.schedule.update({
    where: { userId },
    data: schedule,
  });
}

export async function getSessionById(sessionId: string) {
  return await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      sessionExercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

export async function insertSession(session: { userId: string; muscleGroup: string }) {
  return await prisma.session.create({
    data: session,
  });
}

export async function updateSession(sessionId: string, data: { completed?: boolean }) {
  return await prisma.session.update({
    where: { id: sessionId },
    data,
  });
}

export async function insertSet(set: {
  sessionExerciseId: string;
  weight: number;
  reps: number;
  unit?: string;
}) {
  return await prisma.set.create({
    data: set,
  });
}

export async function updateSet(
  setId: string,
  data: { weight?: number; reps?: number; unit?: string },
) {
  return await prisma.set.update({
    where: { id: setId },
    data,
  });
}

export async function deleteSet(setId: string) {
  return await prisma.set.delete({
    where: { id: setId },
  });
}

export async function getSetsBySessionExerciseId(sessionExerciseId: string) {
  return await prisma.set.findMany({
    where: { sessionExerciseId },
  });
}

export async function insertSessionExercise(sessionExercise: {
  sessionId: string;
  exerciseId: string;
}) {
  return await prisma.sessionExercise.create({
    data: sessionExercise,
    include: {
      exercise: true,
      sets: true,
    },
  });
}

export async function deleteSessionExercise(sessionExerciseId: string) {
  return await prisma.sessionExercise.delete({
    where: { id: sessionExerciseId },
  });
}
