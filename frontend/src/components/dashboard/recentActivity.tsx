import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import { formatSetValue, hasSetData } from "../../utils/trackingType";

type SetData = {
  weight: number;
  reps: number;
  unit: string;
  durationSeconds?: number | null;
};

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { id: string; name: string };
    sets: SetData[];
  }[];
};

type ExerciseSlide = {
  exerciseId: string;
  name: string;
  sets: SetData[];
  bestSet: SetData;
  delta: number | null;
};

// How long each exercise stays on screen before the next one comes in.
const ROTATE_MS = 5000;
// After a swipe or a tap on a dot, wait a bit longer before rotating again
// so the exercise the user picked doesn't slide away immediately.
const RESUME_AFTER_INTERACTION_MS = 10000;
const SWIPE_THRESHOLD = 40;

function getPreviousWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diff);
  thisMonday.setHours(0, 0, 0, 0);

  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  prevSunday.setHours(23, 59, 59, 999);

  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  prevMonday.setHours(0, 0, 0, 0);

  return { start: prevMonday, end: prevSunday };
}

const maxWeight = (sets: SetData[]) => Math.max(...sets.map((s) => s.weight));

// One slide per exercise done last week (its most recent time that week),
// in workout order, with the change in top weight since the time before.
function buildSlides(completed: SessionData[]): ExerciseSlide[] {
  const { start, end } = getPreviousWeekRange();
  const lastWeek = completed
    .filter((s) => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    })
    // Oldest first, so the rotation follows the week in order.
    .reverse();

  const byExercise = new Map<string, ExerciseSlide>();
  for (const session of lastWeek) {
    const sessionTime = new Date(session.date).getTime();
    for (const se of session.sessionExercises) {
      const sets = se.sets.filter(hasSetData);
      if (sets.length === 0) continue;

      let delta: number | null = null;
      const previous = completed.find(
        (older) =>
          new Date(older.date).getTime() < sessionTime &&
          older.sessionExercises.some(
            (o) => o.exercise.id === se.exercise.id && o.sets.some(hasSetData),
          ),
      );
      if (previous) {
        const prevSets = previous.sessionExercises
          .find((o) => o.exercise.id === se.exercise.id)!
          .sets.filter(hasSetData);
        const diff =
          Math.round((maxWeight(sets) - maxWeight(prevSets)) * 10) / 10;
        if (diff !== 0) delta = diff;
      }

      // Done twice last week: keep the later time, at the earlier spot.
      byExercise.set(se.exercise.id, {
        exerciseId: se.exercise.id,
        name: se.exercise.name,
        sets,
        bestSet: sets.reduce((best, s) => (s.weight > best.weight ? s : best)),
        delta,
      });
    }
  }
  return [...byExercise.values()];
}

export default function RecentActivity() {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<ExerciseSlide[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const pausedUntil = useRef(0);
  const swipeStartX = useRef<number | null>(null);

  const unit = (() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored).weightUnit || "lb" : "lb";
  })();

  useEffect(() => {
    const fetchRecent = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const allRes = await fetch(
          `${API_URL}/sessions/me?start=2000-01-01&end=${new Date().toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!allRes.ok) throw new Error("Erreur fetch sessions");
        const allSessions: SessionData[] = await allRes.json();

        const completed = allSessions
          .filter((s) => s.completed)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
        setSlides(buildSlides(completed));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActive((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const goTo = (index: number) => {
    pausedUntil.current = Date.now() + RESUME_AFTER_INTERACTION_MS;
    setActive((index + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="px-page mt-6">
        <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
          <div className="flex items-end justify-center gap-2 h-10">
            {[40, 60, 35, 80, 55].map((h, i) => (
              <div
                key={i}
                className="w-3 flex-shrink-0 bg-gray-200 rounded-full"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-page mt-7">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          {t("dashboard.lastWeek")}
        </p>
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.exerciseId}
                onClick={() => goTo(i)}
                aria-label={slide.name}
                className="p-1 -m-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-4 bg-[#c9552c]" : "w-1.5 bg-[#d6d0c1]"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {slides.length > 0 ? (
        // Every slide sits in the same grid cell, so the card keeps the
        // height of the tallest one instead of jumping at each change.
        <div
          className="grid select-none"
          style={{ touchAction: "pan-y" }}
          onPointerDown={(e) => {
            swipeStartX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            const startX = swipeStartX.current;
            swipeStartX.current = null;
            if (startX === null || slides.length < 2) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) < SWIPE_THRESHOLD) return;
            goTo(active + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => {
            swipeStartX.current = null;
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.exerciseId}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 flex flex-col rounded-2xl shadow-sm overflow-hidden transition-[opacity,transform] duration-500 ease-out ${
                i === active
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-3 pointer-events-none"
              }`}
            >
              <div className="p-4" style={{ background: "#191714" }}>
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white uppercase tracking-wide">
                      {slide.name}
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-wide mt-1">
                      {t("dashboard.setsCount", { count: slide.sets.length })} ·{" "}
                      {formatSetValue(slide.bestSet)}
                    </p>
                  </div>
                  {slide.delta !== null && (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#c9552c] text-white">
                        <span className="text-xs font-bold">
                          {slide.delta > 0 ? "↑" : "↓"} {Math.abs(slide.delta)}{" "}
                          {unit}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide mt-1.5">
                        {t("dashboard.vsPrevious")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-[#ece7dd] p-3 space-y-1.5">
                {slide.sets.map((set, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "#191714" }}
                    >
                      <span className="text-[11px] font-bold text-white">
                        {j + 1}
                      </span>
                    </div>
                    <span className="text-sm font-black text-gray-900">
                      {formatSetValue(set)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#d6d0c1] rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wide text-center mb-4">
            {t("dashboard.noSessionLastWeek")}
          </p>
          <div className="flex items-end justify-center gap-2 h-12">
            <div className="w-6 h-3 rounded-full bg-gray-300" />
            <div className="w-6 h-5 rounded-full bg-gray-300" />
            <div className="w-6 h-4 rounded-full bg-gray-300" />
            <div className="w-6 h-7 rounded-full bg-gray-300" />
            <div className="w-6 h-6 rounded-full bg-gray-300" />
            <div className="w-6 h-9 rounded-full bg-gray-300" />
            <div className="w-6 h-4 rounded-full bg-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
}
