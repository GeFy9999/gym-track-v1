import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import type { SessionData } from "../types/session";
import { useExercisePresets, type ExercisePreset } from "./useExercisePresets";

const storageKey = (sessionId: string) => `sessionPreset:${sessionId}`;

const authFetch = async (method: string, path: string, body?: object) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
};

const fetchSessionData = async (sessionId: string): Promise<SessionData> =>
  (await authFetch("GET", `/sessions/${sessionId}`)).json();

// An exercise with at least one checked set has been done: switching
// presets never takes it out of the session.
const isStarted = (se: SessionData["sessionExercises"][number]) =>
  se.sets.some((s) => s.completed);

// Presets inside a session. The session remembers which preset it's on
// (this device only), and while one is on, exercises added to or removed
// from the session are added to / removed from that preset too.
//
// Switching (or starting a new preset) replaces every exercise not started
// yet. If what's in the session isn't saved in any preset yet, it's first
// kept as a preset of its own ("Preset 1"…), so nothing is lost.
export function useSessionPresets(
  session: SessionData | null,
  refresh: () => Promise<void>,
  defaultBaseName: string,
) {
  const {
    presets,
    createPreset,
    updatePreset,
    deletePreset,
    nextDefaultName,
  } = useExercisePresets(session?.muscleGroup ?? null);
  const sessionId = session?.id ?? null;
  const [storedPresetId, setStoredPresetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    try {
      setStoredPresetId(localStorage.getItem(storageKey(sessionId)));
    } catch {
      setStoredPresetId(null);
    }
  }, [sessionId]);

  const setActive = (id: string | null) => {
    setStoredPresetId(id);
    if (!sessionId) return;
    try {
      if (id) localStorage.setItem(storageKey(sessionId), id);
      else localStorage.removeItem(storageKey(sessionId));
    } catch {
      // Private mode etc.: still works for this visit.
    }
  };

  // A preset deleted since (from the Exercises page) is simply "none".
  const activePreset = presets.find((p) => p.id === storedPresetId) ?? null;

  const saveCurrentIfUnsaved = async (): Promise<ExercisePreset[]> => {
    if (!session || activePreset || session.sessionExercises.length === 0) {
      return presets;
    }
    const ids = [...new Set(session.sessionExercises.map((se) => se.exercise.id))];
    const created = await createPreset(nextDefaultName(defaultBaseName), ids);
    return [...presets, created];
  };

  // Makes the session hold `exerciseIds` (in that order), after the
  // exercises already started, which stay where they are.
  const applyExercises = async (exerciseIds: string[]) => {
    if (!sessionId) return;
    const current = await fetchSessionData(sessionId);
    const wanted = new Set(exerciseIds);

    for (const se of current.sessionExercises) {
      if (!isStarted(se) && !wanted.has(se.exercise.id)) {
        await authFetch("DELETE", `/session-exercises/${se.id}`);
      }
    }
    const present = new Set(
      current.sessionExercises
        .filter((se) => isStarted(se) || wanted.has(se.exercise.id))
        .map((se) => se.exercise.id),
    );
    // One at a time, so they're created in the preset's order.
    for (const exerciseId of exerciseIds) {
      if (present.has(exerciseId)) continue;
      await authFetch("POST", "/session-exercises", { sessionId, exerciseId });
    }

    const after = await fetchSessionData(sessionId);
    const position = (exerciseId: string) => exerciseIds.indexOf(exerciseId);
    const order = [...after.sessionExercises]
      .map((se, i) => ({ se, i }))
      .sort((a, b) => {
        const pa = position(a.se.exercise.id);
        const pb = position(b.se.exercise.id);
        // Started exercises outside the preset first, as they were.
        if (pa === -1 || pb === -1) return pa === pb ? a.i - b.i : pa - pb;
        return pa - pb;
      })
      .map(({ se }) => se.id);
    if (order.length > 1) {
      await authFetch("PATCH", "/session-exercises/reorder", { order });
    }
  };

  const withBusy = async <T>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await action();
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const switchTo = (preset: ExercisePreset) =>
    withBusy(async () => {
      await saveCurrentIfUnsaved();
      await applyExercises(preset.exercises.map((e) => e.id));
      setActive(preset.id);
    });

  const startNewPreset = () =>
    withBusy(async () => {
      const taken = await saveCurrentIfUnsaved();
      const created = await createPreset(
        nextDefaultName(defaultBaseName, taken),
        [],
      );
      await applyExercises([]);
      setActive(created.id);
      return created;
    });

  const renamePreset = async (preset: ExercisePreset, name: string) => {
    await updatePreset(preset.id, { name });
  };

  // Keeps the active preset in step with the session's exercise list.
  // Best effort: offline, the preset just isn't updated.
  const syncAdded = (exerciseId: string) => {
    if (!activePreset) return;
    const ids = activePreset.exercises.map((e) => e.id);
    if (ids.includes(exerciseId)) return;
    updatePreset(activePreset.id, { exerciseIds: [...ids, exerciseId] }).catch(
      (err) => console.error(err),
    );
  };

  const syncRemoved = (exerciseId: string) => {
    if (!activePreset) return;
    const ids = activePreset.exercises.map((e) => e.id);
    if (!ids.includes(exerciseId)) return;
    updatePreset(activePreset.id, {
      exerciseIds: ids.filter((id) => id !== exerciseId),
    }).catch((err) => console.error(err));
  };

  return {
    presets,
    activePreset,
    busy,
    switchTo,
    startNewPreset,
    renamePreset,
    deletePreset,
    syncAdded,
    syncRemoved,
  };
}
