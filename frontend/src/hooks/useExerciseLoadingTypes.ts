import { useState } from "react";
import { API_URL } from "../lib/api";
import { isLoadingType, type LoadingType } from "../utils/loadingType";

// The user's own per-exercise loading-type choices (exerciseId → type),
// overriding the curated/inferred default for that exercise.
export function useExerciseLoadingTypes() {
  const [overrides, setOverrides] = useState<Record<string, LoadingType>>({});

  const fetchLoadingTypes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/exercise-loading-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const rows: { exerciseId: string; loadingType: string }[] =
        await res.json();
      const next: Record<string, LoadingType> = {};
      for (const row of rows) {
        if (isLoadingType(row.loadingType)) next[row.exerciseId] = row.loadingType;
      }
      setOverrides(next);
    } catch (err) {
      console.error(err);
    }
  };

  // null resets the exercise back to its automatic type.
  const saveLoadingType = async (
    exerciseId: string,
    loadingType: LoadingType | null,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const previous = overrides;
    setOverrides((prev) => {
      const next = { ...prev };
      if (loadingType) next[exerciseId] = loadingType;
      else delete next[exerciseId];
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/exercise-loading-types`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exerciseId, loadingType }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement");
    } catch (err) {
      console.error(err);
      setOverrides(previous);
    }
  };

  return { loadingTypeOverrides: overrides, fetchLoadingTypes, saveLoadingType };
}
