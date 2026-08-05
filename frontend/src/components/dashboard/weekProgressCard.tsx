import { useEffect } from "react";

const API_URL = "http://localhost:3000/api";

type Props = {
  weekActive: boolean;
  setWeekActive: (week: boolean) => void;
};

// Retourne le lundi 00:00 de la semaine courante
function getMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=dim, 1=lun, ...
  const diff = day === 0 ? 6 : day - 1; // jours depuis lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function WeekProgress({ weekActive, setWeekActive }: Props) {
  useEffect(() => {
    const checkWeek = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const monday = getMonday();
      const now = new Date();

      try {
        const res = await fetch(
          `${API_URL}/sessions/me?start=${monday.toISOString()}&end=${now.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const sessions = await res.json();
        if (sessions.length > 0) {
          setWeekActive(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkWeek();
  }, [setWeekActive]);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 mx-4 mb-6">
      {weekActive ? (
        <>
          <p className="text-base font-semibold text-white text-center mb-1">
            Semaine en cours
          </p>
          <p className="text-xs text-zinc-500 text-center">
            Ta semaine est active — choisis un groupe musculaire ci-dessous
          </p>
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-white text-center mb-1">
            Aucune semaine active
          </p>
          <p className="text-xs text-zinc-500 text-center mb-4">
            Démarre ta semaine pour commencer à suivre tes entraînements
          </p>
          <button
            onClick={() => setWeekActive(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
          >
            Démarrer une nouvelle semaine
          </button>
        </>
      )}
    </div>
  );
}
