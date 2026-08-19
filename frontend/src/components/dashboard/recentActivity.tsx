import { useEffect, useState } from "react";
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

  // Lundi de cette semaine
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diff);
  thisMonday.setHours(0, 0, 0, 0);

  // Dimanche de la semaine précédente (= veille du lundi courant)
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  prevSunday.setHours(23, 59, 59, 999);

  // Lundi de la semaine précédente
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
          // Prend la session la plus récente
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
      <div className="px-4 mt-6">
        <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
      </div>
    );
  }

  // Extraire le premier exercice avec des sets pour l'affichage
  const firstExercise = lastSession?.sessionExercises?.find(
    (se) => se.sets.length > 0,
  );
  const bestSet = firstExercise?.sets.reduce(
    (best, set) => (set.weight > best.weight ? set : best),
    firstExercise.sets[0],
  );

  return (
    <div className="px-4 mt-6">
      <p className="text-base font-semibold text-gray-900 mb-4">
        Semaine précédente
      </p>

      {lastSession && firstExercise && bestSet ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {firstExercise.exercise.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {bestSet.weight} {bestSet.unit} × {bestSet.reps} reps
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {lastSession.muscleGroup} —{" "}
              {new Date(lastSession.date).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/40 border border-gray-100 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-400">
            Aucune séance la semaine dernière
          </p>
        </div>
      )}
    </div>
  );
}
