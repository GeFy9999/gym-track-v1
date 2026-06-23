import {
  insertSessionExercise,
  deleteSessionExercise,
} from "../repositories/databaseRepository.js";

export async function addExerciseToSession(sessionExercise: { sessionId: string; exerciseId: string }) {
  return await insertSessionExercise(sessionExercise);
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  return await deleteSessionExercise(sessionExerciseId);
}
