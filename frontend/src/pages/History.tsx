import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const API_URL = "/api";

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { name: string };
    sets: { weight: number; reps: number }[];
  }[];
};

type WeekGroup = {
  label: string;
  startDate: Date;
  sessions: SessionData[];
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekGroup[]>([]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${API_URL}/sessions/me?start=2000-01-01&end=${new Date().toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const sessions: SessionData[] = await res.json();

      // Grouper par semaine
      const grouped: { [key: string]: SessionData[] } = {};

      for (const session of sessions) {
        const date = new Date(session.date);
        const day = date.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(date);
        monday.setDate(date.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        const key = monday.toISOString().slice(0, 10);

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(session);
      }

      // Convertir en tableau trié
      const weekList: WeekGroup[] = Object.entries(grouped)
        .map(([key, sessions]) => {
          const startDate = new Date(key);
          const label = `Semaine du ${startDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          })}`;
          return { label, startDate, sessions };
        })
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      setWeeks(weekList);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-zinc-900 min-h-screen px-4">
      <div className="pt-5 mb-6">
        <p className="text-2xl font-bold text-white mb-1">Historique</p>
        <p className="text-sm text-zinc-400">
          {weeks.length > 0
            ? `${weeks.length} semaine${weeks.length > 1 ? "s" : ""} d'entraînement`
            : "Aucun historique encore"}
        </p>
      </div>

      <div className="space-y-3">
        {weeks.map((week) => {
          const isOpen = openWeek === week.label;
          const totalSessions = week.sessions.length;
          const totalSets = week.sessions.reduce(
            (acc, s) =>
              acc + s.sessionExercises.reduce((a, se) => a + se.sets.length, 0),
            0,
          );

          return (
            <div
              key={week.label}
              className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenWeek(isOpen ? null : week.label)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">
                    {week.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {totalSessions} séance{totalSessions > 1 ? "s" : ""} ·{" "}
                    {totalSets} sets
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-zinc-700 px-4 py-3 space-y-2">
                  {week.sessions.map((session) => {
                    const exerciseCount = session.sessionExercises.length;
                    const date = new Date(session.date).toLocaleDateString(
                      "fr-FR",
                      { weekday: "short", day: "numeric", month: "short" },
                    );

                    return (
                      <button
                        key={session.id}
                        onClick={() =>
                          navigate(`/session/${session.id}?readonly=true`)
                        }
                        className="w-full flex items-center justify-between bg-zinc-700/50 hover:bg-zinc-700 rounded-lg px-3 py-3 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-zinc-200">
                            {session.muscleGroup}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {date} · {exerciseCount} exercice
                            {exerciseCount > 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronDown
                          size={16}
                          className="text-zinc-500 -rotate-90"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
