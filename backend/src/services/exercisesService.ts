import {
  getAllExercises,
  getExerciseById,
  getExercisesByMuscleGroup,
  insertExercise,
} from "../repositories/databaseRepository.js";
import { findWorkoutXMatch, getOrFetchGifPath } from "./workoutXGifService.js";

export async function getExercises() {
  return await getAllExercises();
}

// On-demand: resolves "our" exercise to a WorkoutX GIF and fetches it only
// the first time it's actually requested (see workoutXGifService.ts) — never
// called in bulk, so this stays within WorkoutX's caching terms.
export async function getExerciseGifPath(exerciseId: string): Promise<string | null> {
  const exercise = await getExerciseById(exerciseId);
  if (!exercise) return null;

  const match = findWorkoutXMatch(exercise.name);
  if (!match) return null;

  return await getOrFetchGifPath(match.id);
}

export async function getExercisesForMuscleGroup(muscleGroupId: string) {
  return await getExercisesByMuscleGroup(muscleGroupId);
}

export async function createExercise(exercise: {
  name: string;
  muscleGroupId: string;
  isCustom?: boolean;
}) {
  return await insertExercise(exercise);
}
