import {
  insertSet,
  updateSet,
  deleteSet,
  getSetsBySessionExerciseId,
} from "../repositories/databaseRepository.js";

export async function createSet(set: { sessionExerciseId: string; weight: number; reps: number; unit?: string }) {
  return await insertSet(set);
}

export async function editSet(setId: string, data: { weight?: number; reps?: number; unit?: string }) {
  return await updateSet(setId, data);
}

export async function removeSet(setId: string) {
  return await deleteSet(setId);
}

export async function getSetsBySessionExercise(sessionExerciseId: string) {
  return await getSetsBySessionExerciseId(sessionExerciseId);
}
