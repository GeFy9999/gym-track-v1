import { getSessionsForUser } from "../repositories/databaseRepository.js";

// Recupere les sessions de la semaine courante pour un utilisateur
// Calcule automatiquement le lundi et dimanche de la semaine en cours
export async function getCalendar(userId) {
  // 1- calculer startOfWeek
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() - 1));

  // 2- calculer endOfWeek
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // 3- recuperer et retourner les sessions de la semaine
  const week = await getSessionsForUser(userId, startOfWeek, endOfWeek);
  return week;
}
