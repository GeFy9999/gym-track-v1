import HeaderDashboard from "../components/dashboard/header";
import WeekProgress from "../components/dashboard/weekProgressCard";
import MuscleGroupsCards from "../components/dashboard/muscleGroupGrid";
import RecentActivity from "../components/dashboard/recentActivity";
import { useState, useEffect } from "react";
import { CheckCircle, Scale } from "lucide-react";
import { API_URL } from "../lib/api";

export default function DashboardPage() {
  const [weekActive, setWeekActive] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");

  useEffect(() => {
    const checkBodyWeight = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const snoozed = localStorage.getItem("weightSnooze");
      if (snoozed) {
        const snoozeDate = new Date(snoozed);
        const now = new Date();
        if (
          snoozeDate.getDate() === now.getDate() &&
          snoozeDate.getMonth() === now.getMonth() &&
          snoozeDate.getFullYear() === now.getFullYear()
        ) {
          return;
        }
      }

      const res = await fetch(`${API_URL}/body-weight`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const entries = await res.json();

      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - diff);
      thisMonday.setHours(0, 0, 0, 0);

      const prevMonday = new Date(thisMonday);
      prevMonday.setDate(thisMonday.getDate() - 7);

      const hasEntryThisWeek = entries.some((e: { date: string }) => {
        const d = new Date(e.date);
        return d >= thisMonday;
      });

      if (!hasEntryThisWeek) {
        setShowWeightPrompt(true);
      }
    };
    checkBodyWeight();
  }, []);

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

  const handleSaveWeight = async () => {
    const token = localStorage.getItem("token");
    if (!token || !bodyWeight) return;

    try {
      await fetch(`${API_URL}/body-weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: Number(bodyWeight) }),
      });

      setShowWeightPrompt(false);
      setBodyWeight("");
      localStorage.removeItem("weightSnooze");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnoozeWeight = () => {
    localStorage.setItem("weightSnooze", new Date().toISOString());
    setShowWeightPrompt(false);
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <HeaderDashboard />
      <WeekProgress weekActive={weekActive} setWeekActive={setWeekActive} />
      <MuscleGroupsCards weekActive={weekActive} />
      <RecentActivity />

      {/* End session button */}
      {weekActive && (
        <div className="px-4 mt-6">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-gray-900 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Terminer la séance
          </button>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-gray-900 px-6 py-3 rounded-xl shadow-lg shadow-green-600/30 flex items-center gap-2 z-50">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">
            Séance terminée ! Tes exercices sont sauvegardés.
          </span>
        </div>
      )}

      {/* Confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Terminer la séance ?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Les sessions d'aujourd'hui seront marquées comme terminées. Tu
              pourras en créer de nouvelles demain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-zinc-600 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 bg-green-600 hover:bg-green-700 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeightPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center mb-3">
                <Scale size={24} className="text-orange-400" />
              </div>
              <p className="text-base font-semibold text-gray-900 text-center">
                Quel est ton poids ?
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Entre ton poids pour suivre ta progression
              </p>
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-semibold text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-orange-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {(() => {
                  const stored = localStorage.getItem("user");
                  if (!stored) return "lb";
                  return JSON.parse(stored).weightUnit || "lb";
                })()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSnoozeWeight}
                className="flex-1 bg-gray-100 hover:bg-zinc-600 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Plus tard
              </button>
              <button
                onClick={handleSaveWeight}
                disabled={!bodyWeight}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
