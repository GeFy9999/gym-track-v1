import { useState, useEffect } from "react";
import { API_URL } from "../lib/api";
import i18n from "../i18n";
import { formatDuration } from "../utils/units";
import { hasSetData } from "../utils/trackingType";

type SetData = {
  weight: number;
  reps: number;
  durationSeconds?: number | null;
  type?: string;
};

const isWorkingSet = (s: SetData) => s.type !== "warmup" && hasSetData(s);

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
          fetch(`${API_URL}/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
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

// One short line however the sets varied — "3 séries de 11 reps à 65 lb",
// or with ranges when they didn't all match: "4 séries de 6–9 reps à
// 185 lb", "4 séries de 6–10 reps à 135–185 lb". (Listing every set
// separately made this line several lines long.)
export function formatLastTime(lastTime: LastTime): string {
  const { sets, unit } = lastTime;
  const range = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `${min}` : `${min}–${max}`;
  };

  // Timed exercise (treadmill, bike…): "2 séries de 12:00".
  const durations = sets.map((s) => s.durationSeconds ?? 0);
  if (durations.some((d) => d > 0)) {
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    return i18n.t("session.lastTimeDuration", {
      count: sets.length,
      duration:
        min === max
          ? formatDuration(max)
          : `${formatDuration(min)}–${formatDuration(max)}`,
    });
  }

  const maxReps = Math.max(...sets.map((s) => s.reps));

  // Bodyweight (no weight logged): "3 séries de 12 reps au poids de corps".
  if (sets.every((s) => s.weight === 0)) {
    return i18n.t("session.lastTimeBodyweight", {
      count: sets.length,
      reps: range(sets.map((s) => s.reps)),
    });
  }

  return i18n.t("session.lastTimeUniform", {
    count: sets.length,
    reps: range(sets.map((s) => s.reps)),
    weight: range(sets.map((s) => s.weight)),
    unit,
    context: maxReps > 1 ? "plural" : undefined,
  });
}
