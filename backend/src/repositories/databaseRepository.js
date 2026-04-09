import { prisma } from "../prisma.js";

//Recupère toutes les sessions d'un utilisateur entre deux dates
//Inclut les exercices et les sets associes a chaque session
export async function getSessionsForUser(userId, startDate, endDate) {
  return await prisma.session.findMany({
    where: {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
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

//chercher tous les exercises dans la table Exercise
//chaque exercise inclut un muscleGroup avoir l'objet au complet
export async function getAllExercises() {
  return await prisma.exercise.findMany({
    include: {
      muscleGroup: true,
    },
  });
}

//insert dans la table exercise un nouvel exercise
export async function insertExercise(exercise) {
  await prisma.exercise.create({
    data: exercise,
  });
}

//insert dans la table muscleGroups un nouvel muscleGroup
export async function insertMuscleGroup(muscleGroup) {
  await prisma.muscleGroup.create({
    data: muscleGroup,
  });
}

//Meme chose que getAllExercises mais filtree a la place de
//retourner tous les exercices, retourne juste ceux qui
//appartiennent a un MuscleGroup specifique
export async function getExercisesByMuscleGroup(muscleGroupId) {
  return await prisma.exercise.findMany({
    where: { muscleGroupId },
    include: { muscleGroup: true },
  });
}

//retourne la liste de tous les MuscleGroups
export async function getAllMuscleGroups() {
  return await prisma.muscleGroup.findMany();
}
