import { getAllMuscleGroups } from "../repositories/databaseRepository.js";
import { insertMuscleGroup } from "../repositories/databaseRepository.js";

export async function getMuscleGroups() {
  return await getAllMuscleGroups();
}

export async function createMuscleGroup(muscleGroup: { name: string; description: string; image: string }) {
  await insertMuscleGroup(muscleGroup);
}
