import { prisma } from "../prisma.js";

export async function getSessionsForUser(
  userId: string,
  startDate: Date,
  endDate: Date,
) {
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

export async function insertExercise(exercise: {
  name: string;
  muscleGroupId: string;
  isCustom?: boolean;
}) {
  await prisma.exercise.create({
    data: exercise,
  });
}

export async function insertMuscleGroup(muscleGroup: {
  name: string;
  description: string;
  image: string;
}) {
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

export async function insertSchedule(schedule: {
  userId: string;
  frequency: number;
  days: string;
}) {
  return await prisma.schedule.create({
    data: schedule,
  });
}

export async function updateSchedule(
  userId: string,
  schedule: { frequency?: number; days?: string },
) {
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
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

export async function insertSession(session: {
  userId: string;
  muscleGroup: string;
}) {
  return await prisma.session.create({
    data: session,
  });
}

export async function updateSession(
  sessionId: string,
  data: { completed?: boolean },
) {
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
  data: {
    weight?: number;
    reps?: number;
    unit?: string;
    completed?: boolean;
    type?: string;
  },
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
  const order = await prisma.sessionExercise.count({
    where: { sessionId: sessionExercise.sessionId },
  });
  return await prisma.sessionExercise.create({
    data: { ...sessionExercise, order },
    include: {
      exercise: true,
      sets: true,
    },
  });
}

export async function deleteSessionExercise(sessionExerciseId: string) {
  const existing = await prisma.sessionExercise.findUnique({
    where: { id: sessionExerciseId },
    select: { supersetId: true },
  });

  // Delete sets first (FK constraint)
  await prisma.set.deleteMany({
    where: { sessionExerciseId },
  });
  const deleted = await prisma.sessionExercise.delete({
    where: { id: sessionExerciseId },
  });

  // A superset needs 2+ members — dissolve the group if this leaves only 1.
  if (existing?.supersetId) {
    const remaining = await prisma.sessionExercise.count({
      where: { supersetId: existing.supersetId },
    });
    if (remaining < 2) {
      await prisma.sessionExercise.updateMany({
        where: { supersetId: existing.supersetId },
        data: { supersetId: null },
      });
    }
  }

  return deleted;
}

export async function reorderSessionExercises(order: string[]) {
  await Promise.all(
    order.map((id, index) =>
      prisma.sessionExercise.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );
}

export async function linkSuperset(exerciseIds: string[]) {
  const existing = await prisma.sessionExercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { supersetId: true },
  });
  const oldGroupIds = [
    ...new Set(
      existing.map((e) => e.supersetId).filter((id): id is string => !!id),
    ),
  ];

  const newSupersetId = crypto.randomUUID();
  await prisma.sessionExercise.updateMany({
    where: { id: { in: exerciseIds } },
    data: { supersetId: newSupersetId },
  });

  // A superset needs 2+ members — dissolve any old group left with fewer.
  for (const oldId of oldGroupIds) {
    const remaining = await prisma.sessionExercise.count({
      where: { supersetId: oldId },
    });
    if (remaining < 2) {
      await prisma.sessionExercise.updateMany({
        where: { supersetId: oldId },
        data: { supersetId: null },
      });
    }
  }

  return newSupersetId;
}

export async function unlinkSuperset(sessionExerciseId: string) {
  const se = await prisma.sessionExercise.findUnique({
    where: { id: sessionExerciseId },
    select: { supersetId: true },
  });
  if (!se?.supersetId) return;

  await prisma.sessionExercise.update({
    where: { id: sessionExerciseId },
    data: { supersetId: null },
  });

  const remaining = await prisma.sessionExercise.count({
    where: { supersetId: se.supersetId },
  });
  if (remaining < 2) {
    await prisma.sessionExercise.updateMany({
      where: { supersetId: se.supersetId },
      data: { supersetId: null },
    });
  }
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function insertUser(user: {
  email: string;
  password: string;
  name: string;
  authProvider?: string;
}) {
  return await prisma.user.create({
    data: user,
  });
}

export async function getAllUserSessions(userId: string) {
  return await prisma.session.findMany({
    where: { userId },
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

export async function insertBodyWeight(data: {
  userId: string;
  value: number;
}) {
  return await prisma.bodyWeight.create({ data });
}

export async function getBodyWeights(userId: string) {
  return await prisma.bodyWeight.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
}

export async function getTrackedExercises(userId: string) {
  return await prisma.trackedExercise.findMany({
    where: { userId },
    include: { exercise: true },
  });
}

export async function addTrackedExercise(userId: string, exerciseId: string) {
  return await prisma.trackedExercise.create({
    data: { userId, exerciseId },
  });
}

export async function removeTrackedExercise(id: string) {
  return await prisma.trackedExercise.delete({
    where: { id },
  });
}

export async function getExerciseNotes(userId: string) {
  return await prisma.exerciseNote.findMany({
    where: { userId },
  });
}

export async function upsertExerciseNote(
  userId: string,
  exerciseId: string,
  note: string,
) {
  return await prisma.exerciseNote.upsert({
    where: { userId_exerciseId: { userId, exerciseId } },
    update: { note },
    create: { userId, exerciseId, note },
  });
}

export async function deleteExerciseNote(userId: string, exerciseId: string) {
  await prisma.exerciseNote.deleteMany({
    where: { userId, exerciseId },
  });
}
