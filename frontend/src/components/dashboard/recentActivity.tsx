import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { API_URL } from "../../lib/api";

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { name: string };
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
  const [lastSession, setLastSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { start, end } = getPreviousWeekRange();

      try {
        const res = await fetch(
          `${API_URL}/sessions/me?start=${start.toISOString()}&end=${end.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Erreur fetch sessions");
        const sessions: SessionData[] = await res.json();

        if (sessions.length > 0) {
          const sorted = sessions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          setLastSession(sorted[0]);
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
        <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
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
  const maxWeight =
    sets.length > 0 ? Math.max(...sets.map((s) => s.weight)) : 0;

  return (
    <div className="px-5 mt-6">
      <p className="text-[15px] font-bold text-gray-900 mb-3">
        Dernière séance
      </p>

      {lastSession && firstExercise && bestSet ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {firstExercise.exercise.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {bestSet.weight} {bestSet.unit} × {bestSet.reps} reps
              </p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 text-[#3a9e6e] border border-emerald-200 px-2 py-0.5 rounded-full">
              <TrendingUp size={12} />
              <span className="text-xs font-semibold">+5 {bestSet.unit}</span>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-10">
            {sets.map((set, i) => {
              const height =
                maxWeight > 0 ? (set.weight / maxWeight) * 100 : 50;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gray-300"
                  style={{
                    height: `${Math.max(height, 15)}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white/60 border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-400 text-center mb-3">
            Aucune séance la semaine dernière
          </p>
          <div className="flex items-end justify-center gap-2 h-12">
            <div className="w-6 h-3 rounded-sm bg-gray-200" />
            <div className="w-6 h-5 rounded-sm bg-gray-200" />
            <div className="w-6 h-4 rounded-sm bg-gray-200" />
            <div className="w-6 h-7 rounded-sm bg-gray-200" />
            <div className="w-6 h-6 rounded-sm bg-gray-200" />
            <div className="w-6 h-9 rounded-sm bg-gray-200" />
            <div className="w-6 h-4 rounded-sm bg-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
}
