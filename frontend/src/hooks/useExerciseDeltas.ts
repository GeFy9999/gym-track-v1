import { useState, useEffect } from "react";
import { API_URL } from "../lib/api";

type SetData = {
  weight: number;
  reps: number;
  type?: string;
};

const isWorkingSet = (s: SetData) => s.type !== "warmup";

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

export type LastTime = {
  sets: SetData[];
  unit: string;
};

export function useExerciseHistory(sessionId?: string) {
  const [deltas, setDeltas] = useState<Map<string, Delta>>(new Map());
  const [lastTimes, setLastTimes] = useState<Map<string, LastTime>>(new Map());

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

        const deltaResult = new Map<string, Delta>();
        const lastTimeResult = new Map<string, LastTime>();
        const stored = localStorage.getItem("user");
        const unit = stored ? JSON.parse(stored).weightUnit || "lb" : "lb";

        for (const se of current.sessionExercises) {
          let previousWorkingSets: SetData[] | undefined;
          for (const session of completed) {
            const match = session.sessionExercises.find(
              (prev) => prev.exercise.id === se.exercise.id,
            );
            const workingSets = match?.sets.filter(isWorkingSet) ?? [];
            if (workingSets.length > 0) {
              previousWorkingSets = workingSets;
              break;
            }
          }

          if (!previousWorkingSets) continue;

          lastTimeResult.set(se.exercise.id, {
            sets: previousWorkingSets,
            unit,
          });

          const currentWorkingSets = se.sets.filter(isWorkingSet);
          const currentMax =
            currentWorkingSets.length > 0
              ? Math.max(...currentWorkingSets.map((s) => s.weight))
              : 0;
          if (currentMax === 0) continue;

          const previousMax = Math.max(
            ...previousWorkingSets.map((s) => s.weight),
          );
          const diff = Math.round((currentMax - previousMax) * 10) / 10;
          if (diff !== 0) {
            deltaResult.set(se.exercise.id, { value: diff, unit });
          }
        }

        setDeltas(deltaResult);
        setLastTimes(lastTimeResult);
      } catch (err) {
        console.error(err);
      }
    };

    compute();
  }, [sessionId]);

  return { deltas, lastTimes };
}

export function formatLastTime(lastTime: LastTime): string {
  const { sets, unit } = lastTime;
  const [first] = sets;
  const allSame = sets.every(
    (s) => s.weight === first.weight && s.reps === first.reps,
  );

  if (allSame) {
    const setsLabel = sets.length > 1 ? "séries" : "série";
    const repsLabel = first.reps > 1 ? "reps" : "rep";
    return `${sets.length} ${setsLabel} de ${first.reps} ${repsLabel} à ${first.weight} ${unit}`;
  }

  return sets
    .map((s) => `${s.weight} ${unit} × ${s.reps} rep${s.reps > 1 ? "s" : ""}`)
    .join(", ");
}
