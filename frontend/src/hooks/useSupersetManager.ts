import { useState } from "react";
import { API_URL } from "../lib/api";
import type { SessionData, SessionExercise } from "../types/session";

export function useSupersetManager(
  session: SessionData | null,
  fetchSession: () => Promise<void>,
) {
  const [supersetModalFor, setSupersetModalFor] = useState<string | null>(
    null,
  );
  const [supersetSelection, setSupersetSelection] = useState<Set<string>>(
    new Set(),
  );

  const openSupersetModal = (se: SessionExercise) => {
    const group = session?.sessionExercises
      .filter((s) => s.supersetId && s.supersetId === se.supersetId)
      .map((s) => s.id);
    setSupersetSelection(new Set(group ?? []));
    setSupersetModalFor(se.id);
  };

  const closeSupersetModal = () => setSupersetModalFor(null);

  const toggleSupersetSelection = (id: string) => {
    setSupersetSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmSuperset = async () => {
    if (!supersetModalFor) return;
    const selected = Array.from(supersetSelection).filter(
      (id) => id !== supersetModalFor,
    );

    try {
      if (selected.length === 0) {
        await fetch(
          `${API_URL}/session-exercises/${supersetModalFor}/superset`,
          { method: "DELETE" },
        );
      } else {
        await fetch(`${API_URL}/session-exercises/superset`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseIds: [supersetModalFor, ...selected],
          }),
        });
      }
      await fetchSession();
    } catch (err) {
      console.error(err);
    } finally {
      setSupersetModalFor(null);
    }
  };

  return {
    supersetModalFor,
    supersetSelection,
    openSupersetModal,
    closeSupersetModal,
    toggleSupersetSelection,
    confirmSuperset,
  };
}
