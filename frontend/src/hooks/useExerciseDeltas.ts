import { useState, useEffect } from "react";
import { API_URL } from "../lib/api";

type SetData = {
  weight: number;
  reps: number;
};

type SessionExercise = {
  exercise: { id: string; name: string };
  sets: SetData[];
};

type SessionData = {
  id: string;
  date: string;
  completed: boolean;
  sessionExercises: SessionExercise[];
};

export type Delta = {
  value: number;
  unit: string;
};

export function useExerciseDeltas(sessionId?: string): Map<string, Delta> {
  const [deltas, setDeltas] = useState<Map<string, Delta>>(new Map());

  useEffect(() => {
    if (!sessionId) return;

    const compute = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [currentRes, allRes] = await Promise.all([
          fetch(`${API_URL}/sessions/${sessionId}`),
          fetch(
            `${API_URL}/sessions/me?start=2000-01-01&end=${new Date().toISOString()}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ]);

        if (!currentRes.ok || !allRes.ok) return;

        const current: SessionData = await currentRes.json();
        const all: SessionData[] = await allRes.json();

        const completed = all
          .filter((s) => s.completed && s.id !== current.id)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        const result = new Map<string, Delta>();
        const stored = localStorage.getItem("user");
        const unit = stored ? JSON.parse(stored).weightUnit || "lb" : "lb";

        for (const se of current.sessionExercises) {
          const currentMax =
            se.sets.length > 0 ? Math.max(...se.sets.map((s) => s.weight)) : 0;

          if (currentMax === 0) continue;

          let previousMax = 0;
          for (const session of completed) {
            const match = session.sessionExercises.find(
              (prev) => prev.exercise.id === se.exercise.id,
            );
            if (match && match.sets.length > 0) {
              previousMax = Math.max(...match.sets.map((s) => s.weight));
              break;
            }
          }

          if (previousMax > 0) {
            const diff = Math.round((currentMax - previousMax) * 10) / 10;
            if (diff !== 0) {
              result.set(se.exercise.id, { value: diff, unit });
            }
          }
        }

        setDeltas(result);
      } catch (err) {
        console.error(err);
      }
    };

    compute();
  }, [sessionId]);

  return deltas;
}
