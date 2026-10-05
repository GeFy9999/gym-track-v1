import { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Crown,
  Clock,
} from "lucide-react";
import { API_URL } from "../lib/api";
import { getDateLocale } from "../i18n";
import { getMuscleGroupLabel } from "../utils/muscleGroupLabel";
import { formatWorkoutDuration } from "../utils/units";
import TourOverlay from "../components/TourOverlay";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { useIsPro } from "../hooks/useIsPro";

const FREE_HISTORY_DAYS = 90;

type SessionData = {
  id: string;
  muscleGroup: string;
  date: string;
  completed: boolean;
  durationMinutes: number | null;
  // Older than the free plan's window: date and muscle group only, shown
  // blurred and unclickable behind a Pro badge.
  locked?: boolean;
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

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const hasSetData = (s: { weight: number; reps: number }) =>
  s.weight > 0 || s.reps > 0;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A single gym visit often logs more than one muscle group as separate
// Session records (one per group) — grouping them under a shared day card
// here is purely a display change; each still links to its own session
// detail page exactly as before, so nothing about how sessions are stored,
// completed, or viewed individually is touched.
type DayGroup = { dateKey: string; date: Date; sessions: SessionData[] };

function groupSessionsByDay(sessions: SessionData[]): DayGroup[] {
  const grouped = new Map<string, DayGroup>();
  for (const session of sessions) {
    const date = new Date(session.date);
    const key = dateKey(date);
    const entry = grouped.get(key);
    if (entry) {
      entry.sessions.push(session);
    } else {
      grouped.set(key, { dateKey: key, date, sessions: [session] });
    }
  }
  return Array.from(grouped.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useIsPro();
  const MONTH_LABELS = t("history.months", {
    returnObjects: true,
  }) as string[];
  const DAY_LABELS = t("history.dayLabels", {
    returnObjects: true,
  }) as string[];
  const SET_TYPE_CSV_LABELS: Record<string, string> = {
    normal: t("history.setTypes.normal"),
    warmup: t("history.setTypes.warmup"),
    dropset: t("history.setTypes.dropset"),
    failure: t("history.setTypes.failure"),
  };
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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
  const refMonth = useRef<HTMLDivElement>(null);
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

  // refIndex points into the `refs` array passed to TourOverlay below:
  // [month navigator, week list, first day card, list/calendar tabs].
  const tourSteps = [
    {
      title: t("history.tour.month.title"),
      description: t("history.tour.month.desc"),
      refIndex: 0,
    },
    {
      title: t("history.tour.weeks.title"),
      description: t("history.tour.weeks.desc"),
      refIndex: 1,
    },
    {
      title: t("history.tour.sessionDetail.title"),
      description: t("history.tour.sessionDetail.desc"),
      refIndex: 2,
    },
    {
      title: t("history.tour.calendarView.title"),
      description: t("history.tour.calendarView.desc"),
      refIndex: 3,
    },
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setLoadError(false);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Free users ask for the full range too: the server still caps real
        // sessions at FREE_HISTORY_DAYS and returns anything older as
        // `locked` stubs, shown blurred with a Pro upsell.
        const start = new Date(2000, 0, 1);

        const res = await fetch(
          `${API_URL}/sessions/me?start=${start.toISOString()}&end=${new Date().toISOString()}&includeLocked=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        const sessions: SessionData[] = await res.json();
        // Skip sessions that only ever got empty, never-filled-in set rows —
        // nothing real was performed, so there's nothing to show in history.
        setAllSessions(
          sessions.filter(
            (s) =>
              s.locked ||
              (s.completed &&
                s.sessionExercises.some((se) => se.sets.some(hasSetData))),
          ),
        );
        setLoading(false);
      } catch (err) {
        // A network hiccup or bad response must never leave the user
        // staring at a silent "no history" screen with no way to tell
        // whether their data is actually gone or the request just failed.
        console.error(err);
        setLoadError(true);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isPro, reloadKey]);

  const now = new Date();
  // Both the list and calendar view look at the same navigable month now —
  // the list used to be hard-locked to the real current month, so sessions
  // from any other month looked like missing data even though the calendar
  // (which already had month navigation) could see them just fine.
  //
  // Sessions are filtered to the selected month by their OWN date first,
  // then grouped into weeks for display — not the other way around. A week
  // spanning a month boundary (e.g. Mon Sep 28 – Sun Oct 4) has a Monday in
  // September, so grouping by week first and then keeping only weeks whose
  // Monday falls in October would silently drop every October 1–4 session,
  // even though the month header counts them correctly.
  const selectedMonthWeeks = useMemo<WeekGroup[]>(() => {
    const inSelectedMonth = allSessions.filter((s) => {
      const d = new Date(s.date);
      return (
        d.getFullYear() === calendarMonth.getFullYear() &&
        d.getMonth() === calendarMonth.getMonth()
      );
    });

    // Keyed by the Monday's own local-time Date object, not a re-parsed ISO
    // string: "YYYY-MM-DD" is parsed as UTC midnight, which in any timezone
    // behind UTC renders one day earlier once displayed locally (a Monday
    // Sept 28 would show up labeled "27 septembre"). Keeping the original
    // Date object avoids that round-trip entirely.
    const grouped = new Map<string, { monday: Date; sessions: SessionData[] }>();
    for (const session of inSelectedMonth) {
      const date = new Date(session.date);
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);

      const entry = grouped.get(key);
      if (entry) {
        entry.sessions.push(session);
      } else {
        grouped.set(key, { monday, sessions: [session] });
      }
    }

    return Array.from(grouped.values())
      .map(({ monday: startDate, sessions }) => {
        const label = t("history.weekOf", {
          date: startDate.toLocaleDateString(getDateLocale(), {
            day: "numeric",
            month: "long",
          }),
        });
        return { label, startDate, sessions };
      })
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSessions, calendarMonth]);

  useEffect(() => {
    if (selectedMonthWeeks.length > 0 && !openWeek) {
      setOpenWeek(selectedMonthWeeks[0].label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSessions, calendarMonth]);

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
        throw new Error(t("history.csvNoSessions"));
      }

      const rows: string[] = [];
      rows.push(
        [
          t("history.csv.date"),
          t("history.csv.muscleGroup"),
          t("history.csv.exercise"),
          t("history.csv.set"),
          t("history.csv.type"),
          t("history.csv.weight"),
          t("history.csv.unit"),
          t("history.csv.reps"),
          t("history.csv.validated"),
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
                getMuscleGroupLabel(session.muscleGroup, t),
                se.exercise.name,
                i + 1,
                SET_TYPE_CSV_LABELS[set.type] ?? t("history.setTypes.normal"),
                set.weight,
                set.unit,
                set.reps,
                set.completed ? t("history.csv.yes") : t("history.csv.no"),
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
      showToast(t("history.exportSuccess"));
    } catch (err) {
      console.error(err);
      showToast(t("history.exportError"), "error");
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
              {t("history.title")}
            </h1>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
              {allSessions.length > 0
                ? viewMode === "list"
                  ? t("history.weeksThisMonth", {
                      count: selectedMonthWeeks.length,
                    })
                  : t("history.sessionsTotal", { count: allSessions.length })
                : t("history.noHistoryYet")}
            </p>
          </div>

          {allSessions.length > 0 && (
            <button
              onClick={() =>
                isPro ? setShowExportConfirm(true) : navigate("/upgrade")
              }
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white bg-white/10 px-3.5 py-2.5 rounded-full active:scale-[0.98] transition-all flex-shrink-0 shadow-sm"
            >
              {isPro ? (
                <Upload size={14} className="text-[#e2703a]" />
              ) : (
                <Crown size={14} className="text-[#e2703a]" />
              )}
              {t("history.export")}
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
              <List size={14} /> {t("history.list")}
            </button>
            <button
              ref={calendarTabRef}
              onClick={() =>
                isPro ? setViewMode("calendar") : navigate("/upgrade")
              }
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide py-2.5 rounded-xl transition-colors ${
                viewMode === "calendar" ? "text-gray-900" : "text-white/50"
              }`}
            >
              {isPro ? <CalendarIcon size={14} /> : <Crown size={14} />}{" "}
              {t("history.calendar")}
            </button>
          </div>
        )}
      </div>

      <div className="px-5 pt-5">
      {!isPro && allSessions.length > 0 && (
        <button
          onClick={() => navigate("/upgrade")}
          className="w-full flex items-center gap-2 bg-[#c9552c]/10 text-[#c9552c] text-xs font-semibold px-4 py-3 rounded-2xl mb-4 text-left"
        >
          <Crown size={14} className="flex-shrink-0" />
          {t("history.freePlanBanner", { days: FREE_HISTORY_DAYS })}
        </button>
      )}
      {loadError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 rounded-full bg-red-50 shadow-sm flex items-center justify-center mb-4">
            <History size={24} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            {t("history.loadError")}
          </p>
          <p className="text-sm text-gray-400 text-center px-8 mb-6">
            {t("history.loadErrorDesc")}
          </p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="bg-[#c9552c] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
          >
            {t("history.retry")}
          </button>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-14 h-14 rounded-full bg-[#ece7dd] shadow-sm flex items-center justify-center mb-4">
            <History size={24} className="text-[#c9552c]" />
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            {t("history.noHistory")}
          </p>
          <p className="text-sm text-gray-400 text-center px-8 mb-6">
            {t("history.noHistoryDesc")}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#c9552c] text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            {t("history.startSession")}
          </button>
        </div>
      ) : (
        <>
          <div
            ref={refMonth}
            className="bg-[#ece7dd] rounded-3xl shadow-sm p-4 mb-3"
          >
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
                  {t("history.sessionsThisMonth", {
                    count: monthSessionsCount,
                  })}
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
          </div>

          {viewMode === "list" ? (
            selectedMonthWeeks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-full bg-[#ece7dd] shadow-sm flex items-center justify-center mb-4">
                  <History size={24} className="text-[#c9552c]" />
                </div>
                <p className="text-base font-bold text-gray-900 mb-1">
                  {t("history.noSessionThisMonth")}
                </p>
                <p className="text-sm text-gray-400 text-center px-8 mb-6">
                  {t("history.noSessionThisMonthDesc")}
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-[#c9552c] text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md active:scale-[0.98] transition-all"
                >
                  <Plus size={16} />
                  {t("history.startSession")}
                </button>
              </div>
            ) : (
              <div ref={ref0} className="space-y-3">
                {selectedMonthWeeks.map((week, wi) => {
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
                                {t("history.sessionsCount", {
                                  count: totalSessions,
                                })}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 bg-white/60 px-2.5 py-1 rounded-full">
                                {t("history.setsCount", { count: totalSets })}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">
                              {t("history.noSession")}
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
                          {groupSessionsByDay(week.sessions).map(
                            (day, di) => {
                              const dayNum = day.date.getDate();
                              const dayAbbrev = capitalize(
                                day.date
                                  .toLocaleDateString(getDateLocale(), {
                                    weekday: "short",
                                  })
                                  .replace(".", ""),
                              );
                              const fullDateStr = capitalize(
                                day.date.toLocaleDateString(getDateLocale(), {
                                  day: "numeric",
                                  month: "long",
                                }),
                              );
                              // Every muscle-group session finished together
                              // in the same "finish session" tap carries the
                              // same elapsed time — take the max so one
                              // missing/older value (e.g. finished via the
                              // abandoned-session prompt, which has none)
                              // can't zero out the rest.
                              const dayDurationMinutes = day.sessions.reduce(
                                (max, s) =>
                                  s.durationMinutes && s.durationMinutes > max
                                    ? s.durationMinutes
                                    : max,
                                0,
                              );

                              return (
                                <div
                                  key={day.dateKey}
                                  ref={
                                    wi === 0 && di === 0 ? ref2 : undefined
                                  }
                                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 px-3 pt-3 pb-2">
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
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-gray-400 uppercase">
                                        {fullDateStr}
                                      </p>
                                      {dayDurationMinutes > 0 && (
                                        <p className="flex items-center gap-1 text-[11px] font-bold text-[#c9552c] uppercase mt-0.5">
                                          <Clock size={11} />
                                          {formatWorkoutDuration(
                                            dayDurationMinutes,
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="divide-y divide-gray-100">
                                    {day.sessions.map((session) => {
                                      if (session.locked) {
                                        return (
                                          <div
                                            key={session.id}
                                            className="relative flex items-center gap-3 px-3 py-2.5"
                                          >
                                            <div
                                              aria-hidden
                                              className="text-left flex-1 min-w-0 blur-[5px] select-none pointer-events-none"
                                            >
                                              <p className="text-sm font-bold text-gray-900 uppercase truncate">
                                                {getMuscleGroupLabel(
                                                  session.muscleGroup,
                                                  t,
                                                )}
                                              </p>
                                              <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase">
                                                {t("history.exerciseCount", {
                                                  count: 5,
                                                })}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() =>
                                                navigate("/upgrade")
                                              }
                                              aria-label={t(
                                                "history.lockedSession",
                                                { days: FREE_HISTORY_DAYS },
                                              )}
                                              className="flex items-center gap-1 bg-[#c9552c] text-white text-[10px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm active:scale-[0.97] transition-all flex-shrink-0"
                                            >
                                              <Crown size={12} />
                                              Pro
                                            </button>
                                          </div>
                                        );
                                      }
                                      const exerciseCount =
                                        session.sessionExercises.filter(
                                          (se) => se.sets.some(hasSetData),
                                        ).length;
                                      return (
                                        <button
                                          key={session.id}
                                          onClick={() =>
                                            navigate(
                                              `/session/${session.id}?readonly=true`,
                                            )
                                          }
                                          className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-gray-50 transition-colors"
                                        >
                                          <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 uppercase truncate">
                                              {getMuscleGroupLabel(
                                                session.muscleGroup,
                                                t,
                                              )}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase">
                                              {t("history.exerciseCount", {
                                                count: exerciseCount,
                                              })}
                                            </p>
                                          </div>
                                          <ChevronRight
                                            size={18}
                                            className="text-[#c9552c] flex-shrink-0"
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            },
                          )}
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
                    {t("history.legendSession")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#c9552c]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    {t("history.legendToday")}
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
                      displayedDay.date.toLocaleDateString(getDateLocale(), {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      }),
                    )}
                  </p>
                  <p className="text-base font-black text-white uppercase mt-0.5 truncate">
                    {[
                      ...new Set(
                        displayedDay.sessions.map((s) =>
                          getMuscleGroupLabel(s.muscleGroup, t),
                        ),
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

      {/* Only once there's history to point at: the tour marks itself as
          seen the moment it starts, so starting it on an empty page would
          skip every step and use it up before the user ever saw it. The
          week/session steps are dropped when the shown month is empty. */}
      {!loadError && allSessions.length > 0 && (
        <TourOverlay
          tourKey="history"
          steps={
            selectedMonthWeeks.length > 0
              ? tourSteps
              : tourSteps.filter((s) => s.refIndex === 0 || s.refIndex === 3)
          }
          refs={[refMonth, ref0, ref2, ref1]}
        />
      )}

      {showExportConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-[#faf6f1] rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div
              className="px-6 pt-7 pb-6 text-center"
              style={{ background: "#191714" }}
            >
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                {t("history.exportConfirmTitle")}
              </h2>
            </div>

            <div className="px-5 pt-5 pb-6">
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                {t("history.exportConfirmBody")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportConfirm(false)}
                  className="flex-1 bg-[#ece7dd] text-gray-700 py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-80"
                >
                  {t("dashboard.cancel")}
                </button>
                <button
                  onClick={() => {
                    setShowExportConfirm(false);
                    exportToCsv();
                  }}
                  className="flex-1 bg-[#3a9e6e] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} strokeWidth={3} />
                  {t("history.exportAction")}
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
