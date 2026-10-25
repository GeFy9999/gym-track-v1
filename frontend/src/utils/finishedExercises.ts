// Sessions whose exercises the user marked as finished ("Terminer mes
// exercices"). They look done on the dashboard, but stay open on the server
// until the user taps "Terminer la séance", which completes every open
// session at once (duration, PRs, recap). Purely a client-side display flag.
const KEY = "finishedExercisesSessions";

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (ids: string[]) => {
  try {
    if (ids.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable — the flag is cosmetic, nothing to recover.
  }
};

export const getFinishedExerciseSessionIds = () => new Set(read());

export const markExercisesFinished = (sessionId: string) => {
  const ids = read();
  if (!ids.includes(sessionId)) write([...ids, sessionId]);
};

export const unmarkExercisesFinished = (sessionId: string) => {
  write(read().filter((id) => id !== sessionId));
};

export const clearFinishedExercises = () => write([]);
