import { getSessionsForUser } from "../repositories/databaseRepository";

export async function getCalendar(userId, startDate, endDate) {
  const sessions = await getSessionsForUser(userId, startDate, endDate);

  // business logic here
  return [];
}
