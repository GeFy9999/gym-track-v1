import HeaderDashboard from "../components/dashboard/header";
import WeekProgress from "../components/dashboard/weekProgressCard";
import MuscleGroupsCards from "../components/dashboard/muscleGroupGrid";
import RecentActivity from "../components/dashboard/recentActivity";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { API_URL } from "../lib/api";

export default function DashboardPage() {
  const [weekActive, setWeekActive] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEndSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const res = await fetch(
        `${API_URL}/sessions/me?start=${todayStart.toISOString()}&end=${new Date().toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const sessions = await res.json();

        for (const session of sessions) {
          if (session.completed) continue;

          const hasSets = session.sessionExercises.some(
            (se: { sets: { weight: number; reps: number }[] }) =>
              se.sets.length > 0,
          );

          if (hasSets) {
            await fetch(`${API_URL}/sessions/${session.id}/complete`, {
              method: "PATCH",
            });
          } else {
            await fetch(`${API_URL}/sessions/${session.id}`, {
              method: "DELETE",
            });
          }
        }
      }

      setShowEndConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24 bg-zinc-900 min-h-screen">
      <HeaderDashboard />
      <WeekProgress weekActive={weekActive} setWeekActive={setWeekActive} />
      <MuscleGroupsCards weekActive={weekActive} />
      <RecentActivity />

      {/* End session button */}
      {weekActive && (
        <div className="px-4 mt-6">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Terminer la séance
          </button>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-600/30 flex items-center gap-2 z-50">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">
            Séance terminée ! Tes exercices sont sauvegardés.
          </span>
        </div>
      )}

      {/* Confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-white text-center mb-2">
              Terminer la séance ?
            </p>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Les sessions d'aujourd'hui seront marquées comme terminées. Tu
              pourras en créer de nouvelles demain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
