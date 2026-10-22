import { getOfflineDb } from "./offlineDb";
import { isLocalId, resolveLocalId } from "./syncQueue";

export type LocalSession = {
  id: string;
  muscleGroup: string;
  completed: boolean;
  date: string;
  sessionExercises: {
    sets: { weight: number; reps: number; durationSeconds?: number | null }[];
  }[];
};

// Sessions started offline that the server doesn't know yet (their create
// is still in the sync queue). Lists coming from the server — or its cached
// copy — don't have them, so screens add these in.
export async function getLocalOnlySessions(): Promise<LocalSession[]> {
  const db = await getOfflineDb();
  const cached = await db.getAll("sessionCache");
  return cached
    .filter(
      (c) => isLocalId(c.sessionId) && resolveLocalId(c.sessionId) === c.sessionId,
    )
    .map((c) => c.data as LocalSession);
}

// Records a session started offline so the session page (which reads its
// cache for "temp-" ids) and the dashboard can show it.
export async function saveLocalSession(session: LocalSession) {
  const db = await getOfflineDb();
  await db.put("sessionCache", {
    sessionId: session.id,
    data: session,
    cachedAt: Date.now(),
  });
}
