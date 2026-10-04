import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { id: string; name: string };
    sets: { weight: number; reps: number; unit: string }[];
  }[];
};

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

export default function RecentActivity() {
  const { t } = useTranslation();
  const [lastSession, setLastSession] = useState<SessionData | null>(null);
  const [delta, setDelta] = useState<{ value: number; unit: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

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

        const { start, end } = getPreviousWeekRange();
        const lastWeekSessions = completed.filter((s) => {
          const d = new Date(s.date);
          return d >= start && d <= end;
        });

        if (lastWeekSessions.length > 0) {
          const session = lastWeekSessions[0];
          setLastSession(session);

          const firstEx = session.sessionExercises?.find(
            (se) => se.sets.length > 0,
          );
          if (firstEx) {
            const currentMax = Math.max(...firstEx.sets.map((s) => s.weight));
            const stored = localStorage.getItem("user");
            const unit = stored ? JSON.parse(stored).weightUnit || "lb" : "lb";

            for (const older of completed) {
              if (older.id === session.id) continue;
              const match = older.sessionExercises.find(
                (se) =>
                  se.exercise.id === firstEx.exercise.id && se.sets.length > 0,
              );
              if (match) {
                const prevMax = Math.max(...match.sets.map((s) => s.weight));
                const diff = Math.round((currentMax - prevMax) * 10) / 10;
                if (diff !== 0) {
                  setDelta({ value: diff, unit });
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="px-5 mt-6">
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

  const firstExercise = lastSession?.sessionExercises?.find(
    (se) => se.sets.length > 0,
  );
  const bestSet = firstExercise?.sets.reduce(
    (best, set) => (set.weight > best.weight ? set : best),
    firstExercise.sets[0],
  );

  const sets = firstExercise?.sets || [];

  return (
    <div className="px-5 mt-7">
      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
        {t("dashboard.lastSession")}
      </p>

      {lastSession && firstExercise && bestSet ? (
        <div className="rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4" style={{ background: "#191714" }}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-white uppercase tracking-wide">
                  {firstExercise.exercise.name}
                </p>
                <p className="text-xs text-white/50 uppercase tracking-wide mt-1">
                  {t("dashboard.setsCount", { count: sets.length })} ·{" "}
                  {bestSet.weight} {bestSet.unit} × {bestSet.reps}{" "}
                  {t("dashboard.reps")}
                </p>
              </div>
              {delta && (
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#c9552c] text-white">
                    <span className="text-xs font-bold">
                      {delta.value > 0 ? "↑" : "↓"} {Math.abs(delta.value)}{" "}
                      {delta.unit}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wide mt-1.5">
                    {t("dashboard.vsPrevious")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#ece7dd] p-3 space-y-1.5">
            {sets.map((set, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#191714" }}
                >
                  <span className="text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {set.weight}
                  {set.unit} <span className="text-gray-400">×</span>{" "}
                  {set.reps}
                </span>
              </div>
            ))}
          </div>
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
