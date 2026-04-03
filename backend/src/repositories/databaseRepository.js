import { prisma } from "../prisma.js";

export async function getSessionsForUser(userId, startDate, endDate) {
  // prisma query here
  return [];
}

export async function getAllExercises() {
  //prisma query
  return [];
}

export async function insertExercise(exercise) {
  await prisma.exercise.create({
    data: exercise,
  });
}
