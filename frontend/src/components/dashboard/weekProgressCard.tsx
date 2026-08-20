import { useEffect } from "react";
import { Play, Check } from "lucide-react";
import { API_URL } from "../../lib/api";

type Props = {
  weekActive: boolean;
  setWeekActive: (week: boolean) => void;
};

function getMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
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
    <div className="px-5 mt-4">
      {weekActive ? (
        <div className="w-full bg-gray-200 text-gray-400 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 cursor-default">
          <Check size={18} />
          Semaine en cours
        </div>
      ) : (
        <button
          onClick={() => setWeekActive(true)}
          className="w-full bg-[#c9552c] active:scale-[0.98] text-white py-4 rounded-2xl font-semibold text-base transition-all shadow-md flex items-center justify-center gap-2.5"
        >
          <Play size={18} fill="white" />
          Commencer la semaine
        </button>
      )}
    </div>
  );
}
