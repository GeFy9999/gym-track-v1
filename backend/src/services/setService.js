import {
  insertSet,
  updateSet,
  deleteSet,
  getSetsBySessionExerciseId,
} from "../repositories/databaseRepository.js";

export async function createSet(set) {
  return await insertSet(set);
}

export async function editSet(setId, data) {
  return await updateSet(setId, data);
}

export async function removeSet(setId) {
  return await deleteSet(setId);
}

export async function getSetsBySessionExercise(sessionExerciseId) {
  return await getSetsBySessionExerciseId(sessionExerciseId);
}
