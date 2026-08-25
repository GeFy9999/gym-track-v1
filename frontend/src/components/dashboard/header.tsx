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

      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(streak, 10) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-1.5 rounded-full bg-[#c9552c] animate-streak-fill"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
            {streak < 10 &&
              Array.from({ length: 10 - streak }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-5 h-1.5 rounded-full bg-gray-200"
                />
              ))}
          </div>
          <span className="text-xs text-gray-400 ml-1">
            {streak} jour{streak > 1 ? "s" : ""} de suite
          </span>
        </div>
      )}
    </div>
  );
}
