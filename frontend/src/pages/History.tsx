import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  History,
  Plus,
  Upload,
  Calendar as CalendarIcon,
  List,
} from "lucide-react";
import { API_URL } from "../lib/api";
import TourOverlay from "../components/TourOverlay";

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  sessionExercises: {
    exercise: { id: string; name: string };
    sets: {
      weight: number;
      reps: number;
      unit: string;
      completed: boolean;
      type: string;
    }[];
  }[];
};

const SET_TYPE_CSV_LABELS: Record<string, string> = {
  normal: "Normal",
  warmup: "Échauffement",
  dropset: "Drop set",
  failure: "Échec",
};

const escapeCsvField = (value: string | number): string => {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

type WeekGroup = {
  label: string;
  startDate: Date;
  sessions: SessionData[];
};

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const hasSetData = (s: { weight: number; reps: number }) =>
  s.weight > 0 || s.reps > 0;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function HistoryPage() {
  const navigate = useNavigate();
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    sessions: SessionData[];
  } | null>(null);
  const ref0 = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

  const tourSteps = [
    {
      title: "Ce mois-ci",
      description:
        "Ton historique montre les semaines du mois en cours, organisées avec le nombre de séances et de sets faits.",
      refIndex: 0,
    },
    {
      title: "Vue calendrier",
      description:
        "Pour retrouver un mois précédent, bascule sur la vue calendrier et navigue avec les flèches.",
      refIndex: 1,
    },
    {
      title: "Détail d'une séance",
      description:
        "Clique sur une séance pour revoir tes exercices, poids et répétitions en lecture seule.",
      refIndex: 2,
    },
  ];

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
      // Skip sessions that only ever got empty, never-filled-in set rows —
      // nothing real was performed, so there's nothing to show in history.
      setAllSessions(
        sessions.filter(
          (s) =>
            s.completed &&
            s.sessionExercises.some((se) => se.sets.some(hasSetData)),
        ),
      );
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const weeks = useMemo<WeekGroup[]>(() => {
    const grouped: { [key: string]: SessionData[] } = {};

    for (const session of allSessions) {
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

    return Object.entries(grouped)
      .map(([key, sessions]) => {
        const startDate = new Date(key);
        const label = `Semaine du ${startDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        })}`;
        return { label, startDate, sessions };
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [allSessions]);

  const now = new Date();
  const currentMonthWeeks = weeks.filter(
    (w) =>
      w.startDate.getFullYear() === now.getFullYear() &&
      w.startDate.getMonth() === now.getMonth(),
  );

  useEffect(() => {
    if (currentMonthWeeks.length > 0 && !openWeek) {
      setOpenWeek(currentMonthWeeks[0].label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSessions]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    for (const s of allSessions) {
      const key = dateKey(new Date(s.date));
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [allSessions]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calendarMonth]);

  const isCurrentMonth =
    calendarMonth.getFullYear() === now.getFullYear() &&
    calendarMonth.getMonth() === now.getMonth();

  const exportToCsv = () => {
    const rows: string[] = [];
    rows.push(
      [
        "Date",
        "Groupe musculaire",
        "Exercice",
        "Set",
        "Type",
        "Poids",
        "Unité",
        "Reps",
        "Validé",
      ]
        .map(escapeCsvField)
        .join(","),
    );

    const sorted = [...allSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const session of sorted) {
      const dateStr = new Date(session.date).toISOString().slice(0, 10);
      for (const se of session.sessionExercises) {
        se.sets.filter(hasSetData).forEach((set, i) => {
          rows.push(
            [
              dateStr,
              session.muscleGroup,
              se.exercise.name,
              i + 1,
              SET_TYPE_CSV_LABELS[set.type] ?? "Normal",
              set.weight,
              set.unit,
              set.reps,
              set.completed ? "Oui" : "Non",
            ]
              .map(escapeCsvField)
              .join(","),
          );
        });
      }
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gymstrack-historique-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
        <div className="pt-6 mb-6 animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-52 bg-gray-200 rounded" />
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="h-4 w-44 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
      <div className="pt-6 mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-black text-gray-900 leading-tight">
            Historique
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {allSessions.length > 0
              ? viewMode === "list"
                ? `${currentMonthWeeks.length} semaine${currentMonthWeeks.length > 1 ? "s" : ""} ce mois-ci`
                : `${allSessions.length} séance${allSessions.length > 1 ? "s" : ""} au total`
              : "Aucun historique encore"}
          </p>
        </div>

        {allSessions.length > 0 && (
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl shadow-sm active:scale-[0.98] transition-all flex-shrink-0 mt-1"
          >
            <Upload size={15} className="text-[#c9552c]" />
            Exporter
          </button>
        )}
      </div>

      {allSessions.length === 0 ? (
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
        <>
          <div ref={ref1} className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <List size={14} /> Liste
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-colors ${
                viewMode === "calendar"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <CalendarIcon size={14} /> Calendrier
            </button>
          </div>

          {viewMode === "list" ? (
            currentMonthWeeks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm font-bold text-gray-900 mb-1">
                  Aucune séance ce mois-ci
                </p>
                <p className="text-xs text-gray-400 text-center px-8 mb-4">
                  Consulte le calendrier pour retrouver tes séances des mois
                  précédents
                </p>
                <button
                  onClick={() => setViewMode("calendar")}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm"
                >
                  <CalendarIcon size={14} className="text-[#c9552c]" />
                  Voir le calendrier
                </button>
              </div>
            ) : (
              <div ref={ref0} className="space-y-3">
                {currentMonthWeeks.map((week, wi) => {
                  const isOpen = openWeek === week.label;
                  const totalSessions = week.sessions.length;
                  const totalSets = week.sessions.reduce(
                    (acc, s) =>
                      acc +
                      s.sessionExercises.reduce(
                        (a, se) =>
                          a + se.sets.filter(hasSetData).length,
                        0,
                      ),
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
                            {totalSessions} séance
                            {totalSessions > 1 ? "s" : ""} · {totalSets} sets
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
                          {week.sessions.map((session, si) => {
                            const exerciseCount =
                              session.sessionExercises.filter((se) =>
                                se.sets.some(hasSetData),
                              ).length;
                            const dateStr = new Date(
                              session.date,
                            ).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                            });
                            const capitalizedDate = capitalize(dateStr);

                            return (
                              <div
                                key={session.id}
                                ref={wi === 0 && si === 0 ? ref2 : undefined}
                              >
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/session/${session.id}?readonly=true`,
                                    )
                                  }
                                  className="w-full flex items-center justify-between hover:bg-gray-50 rounded-xl px-3 py-3 transition-colors"
                                >
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {session.muscleGroup}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {capitalizedDate} · {exerciseCount}{" "}
                                      exercice{exerciseCount > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <ChevronRight
                                    size={16}
                                    className="text-gray-400"
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    )
                  }
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <p className="text-sm font-bold text-gray-900">
                  {MONTH_LABELS[calendarMonth.getMonth()]}{" "}
                  {calendarMonth.getFullYear()}
                </p>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    )
                  }
                  disabled={isCurrentMonth}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((d, i) => (
                  <p
                    key={i}
                    className="text-[10px] font-bold text-gray-400 text-center uppercase"
                  >
                    {d}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  const daySessions = sessionsByDate.get(dateKey(cell)) ?? [];
                  const isToday = dateKey(cell) === dateKey(now);

                  return (
                    <button
                      key={i}
                      onClick={() =>
                        daySessions.length > 0 &&
                        setSelectedDay({ date: cell, sessions: daySessions })
                      }
                      disabled={daySessions.length === 0}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                        daySessions.length > 0
                          ? "bg-[#c9552c]/10 active:bg-[#c9552c]/20"
                          : "cursor-not-allowed"
                      } ${isToday ? "ring-2 ring-[#c9552c]" : ""}`}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          daySessions.length > 0
                            ? "text-[#c9552c]"
                            : "text-gray-300"
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                      {daySessions.length > 0 && (
                        <div className="w-1 h-1 rounded-full bg-[#c9552c]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-gray-900 mb-3">
              {capitalize(
                selectedDay.date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }),
              )}
            </p>
            <div className="space-y-2">
              {selectedDay.sessions.map((session) => {
                const exerciseCount = session.sessionExercises.filter((se) =>
                  se.sets.some(hasSetData),
                ).length;
                return (
                  <button
                    key={session.id}
                    onClick={() =>
                      navigate(`/session/${session.id}?readonly=true`)
                    }
                    className="w-full flex items-center justify-between hover:bg-gray-50 rounded-xl px-3 py-3 border border-gray-100 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {session.muscleGroup}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exerciseCount} exercice
                        {exerciseCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <TourOverlay tourKey="history" steps={tourSteps} refs={[ref0, ref1, ref2]} />
    </div>
  );
}
