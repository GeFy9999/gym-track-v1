import { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  History,
  Plus,
  Upload,
  Check,
  Calendar as CalendarIcon,
  List,
} from "lucide-react";
import { API_URL } from "../lib/api";
import TourOverlay from "../components/TourOverlay";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

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
  const [displayedDay, setDisplayedDay] = useState<typeof selectedDay>(null);
  const [dayCardClosing, setDayCardClosing] = useState(false);
  const { toast, toastVariant, closingToast, showToast } = useToast();
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const ref0 = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const listTabRef = useRef<HTMLButtonElement>(null);
  const calendarTabRef = useRef<HTMLButtonElement>(null);
  const [tabIndicator, setTabIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el =
      viewMode === "list" ? listTabRef.current : calendarTabRef.current;
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [viewMode, allSessions.length]);

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

  useEffect(() => {
    if (selectedDay) {
      setDisplayedDay(selectedDay);
      setDayCardClosing(false);
      return;
    }
    if (displayedDay) {
      setDayCardClosing(true);
      const t = setTimeout(() => {
        setDisplayedDay(null);
        setDayCardClosing(false);
      }, 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

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

  const monthSessionsCount = useMemo(() => {
    return allSessions.filter((s) => {
      const d = new Date(s.date);
      return (
        d.getFullYear() === calendarMonth.getFullYear() &&
        d.getMonth() === calendarMonth.getMonth()
      );
    }).length;
  }, [allSessions, calendarMonth]);

  const exportToCsv = () => {
    try {
      if (allSessions.length === 0) {
        throw new Error("Aucune séance à exporter");
      }

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
      showToast("Export réussi");
    } catch (err) {
      console.error(err);
      showToast("Échec de l'export, réessaie", "error");
    }
  };

  if (loading) {
    return (
      <div className="pb-28 bg-[#faf6f1] min-h-screen">
        <div
          className="px-5 pt-8 pb-6 animate-pulse"
          style={{ background: "#191714" }}
        >
          <div className="h-8 w-40 bg-white/10 rounded mb-2" />
          <div className="h-3 w-52 bg-white/10 rounded mb-5" />
          <div className="h-10 w-full bg-white/10 rounded-2xl" />
        </div>
        <div className="px-5 pt-4 space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
              <div className="h-4 w-44 bg-white/50 rounded mb-2" />
              <div className="h-3 w-28 bg-white/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen">
      <div className="px-5 pt-8 pb-6" style={{ background: "#191714" }}>
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-[26px] font-black text-white uppercase tracking-wide leading-tight">
              Historique
            </h1>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
              {allSessions.length > 0
                ? viewMode === "list"
                  ? `${currentMonthWeeks.length} semaine${currentMonthWeeks.length > 1 ? "s" : ""} ce mois-ci`
                  : `${allSessions.length} séance${allSessions.length > 1 ? "s" : ""} au total`
                : "Aucun historique encore"}
            </p>
          </div>

          {allSessions.length > 0 && (
            <button
              onClick={() => setShowExportConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white bg-white/10 px-3.5 py-2.5 rounded-full active:scale-[0.98] transition-all flex-shrink-0 shadow-sm"
            >
              <Upload size={14} className="text-[#e2703a]" />
              Exporter
            </button>
          )}
        </div>

        {allSessions.length > 0 && (
          <div ref={ref1} className="relative flex bg-white/10 rounded-2xl p-1">
            {tabIndicator && (
              <div
                className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm transition-all duration-300 ease-out"
                style={{ left: tabIndicator.left, width: tabIndicator.width }}
              />
            )}
            <button
              ref={listTabRef}
              onClick={() => setViewMode("list")}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide py-2.5 rounded-xl transition-colors ${
                viewMode === "list" ? "text-gray-900" : "text-white/50"
              }`}
            >
              <List size={14} /> Liste
            </button>
            <button
              ref={calendarTabRef}
              onClick={() => setViewMode("calendar")}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide py-2.5 rounded-xl transition-colors ${
                viewMode === "calendar" ? "text-gray-900" : "text-white/50"
              }`}
            >
              <CalendarIcon size={14} /> Calendrier
            </button>
          </div>
        )}
      </div>

      <div className="px-5 pt-5">
      {allSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 rounded-full bg-[#ece7dd] shadow-sm flex items-center justify-center mb-4">
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
                  className="flex items-center gap-1.5 bg-[#ece7dd] text-gray-700 px-4 py-2.5 rounded-full font-bold uppercase tracking-wide text-xs shadow-sm"
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
                      className="bg-[#ece7dd] rounded-3xl shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenWeek(isOpen ? null : week.label)}
                        className="w-full flex items-center justify-between px-4 py-4"
                      >
                        <div className="text-left">
                          <p
                            className={`text-sm font-black uppercase tracking-wide ${
                              totalSessions > 0
                                ? "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {week.label}
                          </p>
                          {totalSessions > 0 ? (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 bg-white/60 px-2.5 py-1 rounded-full">
                                {totalSessions} séance
                                {totalSessions > 1 ? "s" : ""}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 bg-white/60 px-2.5 py-1 rounded-full">
                                {totalSets} sets
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">
                              Aucune séance
                            </p>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                          <ChevronDown
                            size={16}
                            className={`text-gray-500 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && totalSessions > 0 && (
                        <div className="px-3 pb-3 space-y-2">
                          {week.sessions.map((session, si) => {
                            const exerciseCount =
                              session.sessionExercises.filter((se) =>
                                se.sets.some(hasSetData),
                              ).length;
                            const sessionDate = new Date(session.date);
                            const dayNum = sessionDate.getDate();
                            const dayAbbrev = capitalize(
                              sessionDate
                                .toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                })
                                .replace(".", ""),
                            );
                            const fullDateStr = capitalize(
                              sessionDate.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                              }),
                            );

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
                                  className="w-full flex items-center gap-3 bg-white rounded-2xl px-3 py-3 shadow-sm active:scale-[0.99] transition-all"
                                >
                                  <div
                                    className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                                    style={{ background: "#191714" }}
                                  >
                                    <span className="text-sm font-black text-white leading-none">
                                      {dayNum}
                                    </span>
                                    <span className="text-[8px] font-bold text-white/50 uppercase leading-none mt-0.5">
                                      {dayAbbrev}
                                    </span>
                                  </div>
                                  <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 uppercase truncate">
                                      {session.muscleGroup}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase">
                                      {fullDateStr} · {exerciseCount}{" "}
                                      exercice{exerciseCount > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <ChevronRight
                                    size={18}
                                    className="text-[#c9552c] flex-shrink-0"
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
            <>
            <div className="bg-[#ece7dd] rounded-3xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    )
                  }
                  className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center active:bg-white transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <div className="text-center">
                  <p className="text-base font-black text-gray-900 uppercase tracking-wide">
                    {MONTH_LABELS[calendarMonth.getMonth()]}{" "}
                    {calendarMonth.getFullYear()}
                  </p>
                  <p className="text-[11px] font-bold text-[#c9552c] uppercase tracking-wide mt-0.5">
                    {monthSessionsCount} séance
                    {monthSessionsCount > 1 ? "s" : ""} ce mois
                  </p>
                </div>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    )
                  }
                  disabled={isCurrentMonth}
                  className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center active:bg-white transition-colors disabled:opacity-30 flex-shrink-0"
                >
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mt-4 mb-2">
                {DAY_LABELS.map((d, i) => (
                  <p
                    key={i}
                    className="text-[10px] font-bold text-gray-400 text-center uppercase"
                  >
                    {d}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  const daySessions = sessionsByDate.get(dateKey(cell)) ?? [];
                  const hasSessions = daySessions.length > 0;
                  const isToday = dateKey(cell) === dateKey(now);
                  const isSelected =
                    selectedDay && dateKey(selectedDay.date) === dateKey(cell);

                  return (
                    <button
                      key={i}
                      onClick={() =>
                        hasSessions &&
                        setSelectedDay(
                          isSelected ? null : { date: cell, sessions: daySessions },
                        )
                      }
                      disabled={!hasSessions}
                      className="aspect-square flex flex-col items-center justify-center gap-0.5"
                    >
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-colors ${
                          isToday
                            ? "bg-[#c9552c] text-white"
                            : hasSessions
                              ? `bg-[#191714] text-white ${isSelected ? "ring-2 ring-[#c9552c] ring-offset-2 ring-offset-[#ece7dd]" : ""}`
                              : "text-gray-500"
                        }`}
                      >
                        {cell.getDate()}
                      </span>
                      {hasSessions && !isToday && (
                        <div className="w-1 h-1 rounded-full bg-[#c9552c]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-5 border-t border-black/5 mt-4 pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#191714]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Séance
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#c9552c]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Aujourd'hui
                  </span>
                </div>
              </div>
            </div>

            {displayedDay && (
              <button
                onClick={() => {
                  const first = displayedDay.sessions[0];
                  if (first) navigate(`/session/${first.id}?readonly=true`);
                }}
                className={`w-full flex items-center justify-between rounded-3xl px-5 py-4 shadow-sm mt-3 text-left active:scale-[0.99] transition-all ${
                  dayCardClosing ? "animate-soft-fade-out" : "animate-soft-fade-in"
                }`}
                style={{ background: "#191714" }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide truncate">
                    {capitalize(
                      displayedDay.date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      }),
                    )}
                  </p>
                  <p className="text-base font-black text-white uppercase mt-0.5 truncate">
                    {[
                      ...new Set(
                        displayedDay.sessions.map((s) => s.muscleGroup),
                      ),
                    ].join(" · ")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-lg font-black text-white">
                    {displayedDay.sessions.reduce(
                      (acc, s) =>
                        acc +
                        s.sessionExercises.reduce(
                          (a, se) => a + se.sets.filter(hasSetData).length,
                          0,
                        ),
                      0,
                    )}{" "}
                    sets
                  </p>
                </div>
              </button>
            )}
            </>
          )}
        </>
      )}
      </div>

      <TourOverlay tourKey="history" steps={tourSteps} refs={[ref0, ref1, ref2]} />

      {showExportConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-[#faf6f1] rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div
              className="px-6 pt-7 pb-6 text-center"
              style={{ background: "#191714" }}
            >
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                Exporter tes données ?
              </h2>
            </div>

            <div className="px-5 pt-5 pb-6">
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                Un fichier CSV contenant l'historique de tes séances,
                exercices et sets sera téléchargé sur ton appareil.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportConfirm(false)}
                  className="flex-1 bg-[#ece7dd] text-gray-700 py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-80"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowExportConfirm(false);
                    exportToCsv();
                  }}
                  className="flex-1 bg-[#3a9e6e] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} strokeWidth={3} />
                  Exporter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast} closing={closingToast} variant={toastVariant} />
      )}
    </div>
  );
}
