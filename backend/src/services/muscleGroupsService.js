import { getAllMuscleGroups } from "../repositories/databaseRepository.js";
import { insertMuscleGroup } from "../repositories/databaseRepository.js";

export async function getMuscleGroups() {
  return await getAllMuscleGroups();
}

export async function createMuscleGroup(muscleGroup) {
  await insertMuscleGroup(muscleGroup);
}
