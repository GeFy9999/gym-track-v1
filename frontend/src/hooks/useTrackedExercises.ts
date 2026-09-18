import { useState } from "react";
import { API_URL } from "../lib/api";
import type { TrackedExercise } from "../types/session";

export function useTrackedExercises() {
  const [tracked, setTracked] = useState<TrackedExercise[]>([]);

  const isTracked = (exerciseId: string) =>
    tracked.some((t) => t.exerciseId === exerciseId);

  const fetchTracked = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tracked-exercises`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setTracked(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTracked = async (exerciseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const existing = tracked.find((t) => t.exerciseId === exerciseId);

    try {
      if (existing) {
        setTracked((prev) => prev.filter((t) => t.id !== existing.id));
        await fetch(`${API_URL}/tracked-exercises/${existing.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const res = await fetch(`${API_URL}/tracked-exercises`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ exerciseId }),
        });
        if (res.ok) {
          const data = await res.json();
          setTracked((prev) => [...prev, data]);
        }
      }
    } catch (err) {
      console.error(err);
      fetchTracked();
    }
  };

  return { isTracked, fetchTracked, toggleTracked };
}
