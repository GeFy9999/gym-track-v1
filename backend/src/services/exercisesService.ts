import { getAllExercises } from "../repositories/databaseRepository.js";
import { insertExercise } from "../repositories/databaseRepository.js";

export async function getExercises() {
  return await getAllExercises();
}

export async function createExercise(exercise: { name: string; muscleGroupId: string; isCustom?: boolean }) {
  await insertExercise(exercise);
}
