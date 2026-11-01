import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import { cachedJson } from "../lib/cachedFetch";

export type PresetExercise = {
  id: string;
  name: string;
  image: string | null;
  loadingType?: string | null;
  trackingType?: string | null;
  isCustom?: boolean;
};

export type ExercisePreset = {
  id: string;
  name: string;
  muscleGroup: string;
  exercises: PresetExercise[];
};

const request = async (method: string, path: string, body?: object) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/exercise-presets${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
};

// The user's saved exercise lists for one muscle group (null = none
// selected). Reads fall back to the offline cache, so a preset can still be
// seen without signal; creating/editing needs the server.
export function useExercisePresets(muscleGroup: string | null) {
  const [presets, setPresets] = useState<ExercisePreset[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchPresets = useCallback(async () => {
    if (!muscleGroup) {
      setPresets([]);
      setLoaded(true);
      return;
    }
    try {
      const { data } = await cachedJson<ExercisePreset[]>(
        `/exercise-presets?muscleGroup=${encodeURIComponent(muscleGroup)}`,
      );
      setPresets(data);
    } catch (err) {
      console.error(err);
      setPresets([]);
    } finally {
      setLoaded(true);
    }
  }, [muscleGroup]);

  useEffect(() => {
    setLoaded(false);
    fetchPresets();
  }, [fetchPresets]);

  const createPreset = async (name: string, exerciseIds: string[]) => {
    const created: ExercisePreset = await request("POST", "", {
      name,
      muscleGroup,
      exerciseIds,
    });
    setPresets((prev) => [...prev, created]);
    return created;
  };

  const updatePreset = async (
    id: string,
    data: { name?: string; exerciseIds?: string[] },
  ) => {
    const updated: ExercisePreset = await request("PATCH", `/${id}`, data);
    setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePreset = async (id: string) => {
    await request("DELETE", `/${id}`);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  // "Preset 1", "Preset 2"… — the first number not already taken.
  const nextDefaultName = (base: string, taken = presets) => {
    const names = new Set(taken.map((p) => p.name.toLowerCase()));
    let n = 1;
    while (names.has(`${base} ${n}`.toLowerCase())) n++;
    return `${base} ${n}`;
  };

  return {
    presets,
    loaded,
    fetchPresets,
    createPreset,
    updatePreset,
    deletePreset,
    nextDefaultName,
  };
}
