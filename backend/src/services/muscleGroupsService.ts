import { getAllMuscleGroups } from "../repositories/databaseRepository.js";

export async function getMuscleGroups() {
  return await getAllMuscleGroups();
}
