import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { API_URL } from "../../lib/api";

export default function HeaderDashboard() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const stored = localStorage.getItem("user");
  const userName = stored ? JSON.parse(stored).name : "Utilisateur";

  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/sessions/me/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStreak(data.streak);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStreak();
  }, []);

  useEffect(() => {
    const fetchWeekDays = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      try {
        const res = await fetch(
          `${API_URL}/sessions/me?start=${monday.toISOString()}&end=${now.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const sessions = await res.json();
        const daysWithSets = new Set(
          sessions
            .filter((s: { sessionExercises: { sets: unknown[] }[] }) =>
              s.sessionExercises.some((se) => se.sets.length > 0),
            )
            .map((s: { date: string }) => new Date(s.date).toDateString()),
        );
        setWeekDays(daysWithSets.size);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeekDays();
  }, []);

  return (
    <div className="px-5 pt-6 pb-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-s tracking-wide text-gray-400 mb-1">
            {capitalizedDate}
          </p>
          <h1 className="text-[32px] font-black text-gray-900 leading-tight">
            Bonjour, {userName}
          </h1>
        </div>
        <div className="relative mt-1">
          <div className="w-10 h-10 rounded-full bg-[#c9552c]/10 flex items-center justify-center">
            <Flame
              size={20}
              className="text-[#c9552c] animate-flame"
              fill="#c9552c"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 min-w-5 h-5 rounded-full bg-[#c9552c] flex items-center justify-center px-1">
            <span className="text-[10px] font-bold text-white">{streak}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-1.5 rounded-full ${
                i < weekDays ? "bg-[#c9552c] animate-streak-fill" : "bg-gray-200"
              }`}
              style={i < weekDays ? { animationDelay: `${i * 80}ms` } : undefined}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-1">{weekDays}/7 jours</span>
      </div>
    </div>
  );
}
