import {
  insertSessionExercise,
  deleteSessionExercise,
  reorderSessionExercises,
  linkSuperset,
  unlinkSuperset,
} from "../repositories/databaseRepository.js";

export async function addExerciseToSession(sessionExercise: { sessionId: string; exerciseId: string }) {
  return await insertSessionExercise(sessionExercise);
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  return await deleteSessionExercise(sessionExerciseId);
}

export async function reorderSessionExercisesForSession(order: string[]) {
  return await reorderSessionExercises(order);
}

export async function linkExercisesToSuperset(exerciseIds: string[]) {
  return await linkSuperset(exerciseIds);
}

export async function unlinkExerciseFromSuperset(sessionExerciseId: string) {
  return await unlinkSuperset(sessionExerciseId);
}
