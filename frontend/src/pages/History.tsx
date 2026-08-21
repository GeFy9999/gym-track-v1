import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, History, Plus } from "lucide-react";
import { API_URL } from "../lib/api";

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { id: string; name: string };
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
      const filtered = sessions.filter((s) => s.completed);
      const grouped: { [key: string]: SessionData[] } = {};

      for (const session of filtered) {
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
      if (weekList.length > 0) {
        setOpenWeek(weekList[0].label);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
      <div className="pt-6 mb-6">
        <h1 className="text-[32px] font-black text-gray-900 leading-tight">
          Historique
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {weeks.length > 0
            ? `${weeks.length} semaine${weeks.length > 1 ? "s" : ""} d'entraînement`
            : "Aucun historique encore"}
        </p>
      </div>

      {weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
            <History size={24} className="text-[#c9552c]" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            Aucun historique
          </p>
          <p className="text-sm text-gray-400 text-center px-8 mb-6">
            Tes séances apparaîtront ici une fois que tu auras commencé à
            t'entraîner
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#c9552c] text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            Commencer une séance
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => {
            const isOpen = openWeek === week.label;
            const totalSessions = week.sessions.length;
            const totalSets = week.sessions.reduce(
              (acc, s) =>
                acc +
                s.sessionExercises.reduce((a, se) => a + se.sets.length, 0),
              0,
            );

            return (
              <div
                key={week.label}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenWeek(isOpen ? null : week.label)}
                  className="w-full flex items-center justify-between px-4 py-4"
                >
                  <div className="text-left">
                    <p className="text-base font-bold text-gray-900">
                      {week.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {totalSessions} séance{totalSessions > 1 ? "s" : ""} ·{" "}
                      {totalSets} sets
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                    {week.sessions.map((session) => {
                      const exerciseCount = session.sessionExercises.length;
                      const dateStr = new Date(session.date).toLocaleDateString(
                        "fr-FR",
                        { weekday: "short", day: "numeric", month: "long" },
                      );
                      const capitalizedDate =
                        dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                      return (
                        <button
                          key={session.id}
                          onClick={() =>
                            navigate(`/session/${session.id}?readonly=true`)
                          }
                          className="w-full flex items-center justify-between hover:bg-gray-50 rounded-xl px-3 py-3 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900">
                              {session.muscleGroup}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {capitalizedDate} · {exerciseCount} exercice
                              {exerciseCount > 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
