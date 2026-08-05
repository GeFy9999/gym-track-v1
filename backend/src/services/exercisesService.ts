import {
  getAllExercises,
  getExercisesByMuscleGroup,
  insertExercise,
} from "../repositories/databaseRepository.js";

export async function getExercises() {
  return await getAllExercises();
}

export async function getExercisesForMuscleGroup(muscleGroupId: string) {
  return await getExercisesByMuscleGroup(muscleGroupId);
}

export async function createExercise(exercise: {
  name: string;
  muscleGroupId: string;
  isCustom?: boolean;
}) {
  await insertExercise(exercise);
}
