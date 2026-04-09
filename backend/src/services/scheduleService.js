import {
  getScheduleByUserId,
  insertSchedule,
  updateSchedule,
} from "../repositories/databaseRepository.js";

// Récupère le schedule d'un utilisateur
export async function getSchedule(userId) {
  return await getScheduleByUserId(userId);
}

// Crée le schedule d'un utilisateur
export async function createSchedule(schedule) {
  return await insertSchedule(schedule);
}

// Met à jour le schedule d'un utilisateur
export async function editSchedule(userId, schedule) {
  return await updateSchedule(userId, schedule);
}
