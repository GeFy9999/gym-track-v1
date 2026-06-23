import {
  getScheduleByUserId,
  insertSchedule,
  updateSchedule,
} from "../repositories/databaseRepository.js";

// Récupère le schedule d'un utilisateur
export async function getSchedule(userId: string) {
  return await getScheduleByUserId(userId);
}

// Crée le schedule d'un utilisateur
export async function createSchedule(schedule: { userId: string; frequency: number; days: string }) {
  return await insertSchedule(schedule);
}

// Met à jour le schedule d'un utilisateur
export async function editSchedule(userId: string, schedule: { frequency?: number; days?: string }) {
  return await updateSchedule(userId, schedule);
}
