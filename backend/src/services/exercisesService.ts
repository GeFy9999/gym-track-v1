import {
  getAllExercises,
  getExercisesByMuscleGroup,
  insertExercise,
} from "../repositories/databaseRepository.js";
import { prisma } from "../prisma.js";
import {
  getExerciseDbGifPath,
  getExerciseDbThumbnailPath,
} from "./exerciseDb.js";

export async function getExercises(userId: string) {
  return await getAllExercises(userId);
}

async function getExerciseDbId(exerciseId: string): Promise<string | null> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { exerciseDbId: true },
  });
  return exercise?.exerciseDbId ?? null;
}

// The exercise's ExerciseDB GIF (large, for detail/info screens), read from
// the licensed pack on the server's volume. Null for custom exercises.
export async function getExerciseGifPath(exerciseId: string): Promise<string | null> {
  const exerciseDbId = await getExerciseDbId(exerciseId);
  return exerciseDbId ? getExerciseDbGifPath(exerciseDbId, 360) : null;
}

// A static still of the small GIF, for list rows.
export async function getExerciseThumbnailPath(exerciseId: string): Promise<string | null> {
  const exerciseDbId = await getExerciseDbId(exerciseId);
  return exerciseDbId ? await getExerciseDbThumbnailPath(exerciseDbId) : null;
}

export async function getExercisesForMuscleGroup(
  muscleGroupId: string,
  userId: string,
) {
  return await getExercisesByMuscleGroup(muscleGroupId, userId);
}

export async function createExercise(exercise: {
  name: string;
  muscleGroupId: string;
  userId: string;
}) {
  return await insertExercise(exercise);
}
