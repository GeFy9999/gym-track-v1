import {
  insertSessionExercise,
  deleteSessionExercise,
} from "../repositories/databaseRepository.js";

export async function addExerciseToSession(sessionExercise) {
  return await insertSessionExercise(sessionExercise);
}

export async function removeExerciseFromSession(sessionExerciseId) {
  return await deleteSessionExercise(sessionExerciseId);
}
