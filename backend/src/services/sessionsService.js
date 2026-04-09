import {
  getSessionById,
  insertSession,
  updateSession,
} from "../repositories/databaseRepository.js";

// Récupère une session par son id
export async function getSession(sessionId) {
  return await getSessionById(sessionId);
}

// Crée une nouvelle session
export async function createSession(session) {
  return await insertSession(session);
}

// Marque une session comme complétée
export async function completeSession(sessionId) {
  return await updateSession(sessionId, { completed: true });
}
