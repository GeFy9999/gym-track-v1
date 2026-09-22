import HeaderDashboard from "../components/dashboard/header";
import WeekProgress from "../components/dashboard/weekProgressCard";
import MuscleGroupsCards from "../components/dashboard/muscleGroupGrid";
import RecentActivity from "../components/dashboard/recentActivity";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Scale, ChevronRight, Check } from "lucide-react";
import { API_URL } from "../lib/api";
import TourOverlay from "../components/TourOverlay";
import PRCelebration from "../components/session/PRCelebration";
import WorkoutSummary from "../components/session/WorkoutSummary";
import { getWeightUnit } from "../utils/units";
import { useUiChrome } from "../contexts/UiChromeContext";
import { getDateLocale } from "../i18n";

type AbandonedSession = {
  id: string;
  muscleGroup: string;
  date: string;
};

type PRCelebrationData = {
  exerciseName: string;
  weight: number;
  unit: string;
};

type ExerciseDelta = { exerciseName: string; delta: number; unit: string };

type WorkoutSummaryData = {
  muscleGroups: string[];
  date: string;
  durationMinutes: number;
  totalSets: number;
  totalExercises: number;
  prs: PRCelebrationData[];
  exerciseDeltas: ExerciseDelta[];
};

const formatAbandonedDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(getDateLocale(), {
    weekday: "long",
    day: "numeric",
  });

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const userName = user?.name || "";
  const userId = user?.id || "";

  const [weekActive, setWeekActive] = useState<boolean>(() => {
    return localStorage.getItem(`weekActive_${userId}`) === "true";
  });
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");
  const [promptUnit, setPromptUnit] = useState(() => getWeightUnit());
  const [refreshKey, setRefreshKey] = useState(0);
  const [abandonedQueue, setAbandonedQueue] = useState<AbandonedSession[]>([]);
  const [prQueue, setPrQueue] = useState<PRCelebrationData[]>([]);
  const [pendingSummary, setPendingSummary] =
    useState<WorkoutSummaryData | null>(null);
  const [workoutSummary, setWorkoutSummary] =
    useState<WorkoutSummaryData | null>(null);

  // Onboarding
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboardingWeight, setShowOnboardingWeight] = useState(false);
  const { setNavHidden } = useUiChrome();

  useEffect(() => {
    setNavHidden(showWelcome);
    return () => setNavHidden(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcome]);
  const [showTour, setShowTour] = useState(false);

  const handleSetWeekActive = (val: boolean) => {
    setWeekActive(val);
    localStorage.setItem(`weekActive_${userId}`, String(val));
  };

  // Always check weekActive on mount/return
  useEffect(() => {
    const checkWeek = async () => {
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
        if (sessions.length > 0) handleSetWeekActive(true);
      } catch (err) {
        console.error(err);
      }
    };
    checkWeek();
  }, []);

  // Detect sessions left unfinished on a previous day
  useEffect(() => {
    const checkAbandoned = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/sessions/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const sessions = await res.json();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const toPrompt: AbandonedSession[] = [];
        const toDelete: string[] = [];

        for (const session of sessions) {
          if (session.completed) continue;
          if (new Date(session.date) >= todayStart) continue;

          const hasSets = session.sessionExercises.some(
            (se: { sets: { weight: number; reps: number }[] }) =>
              se.sets.length > 0,
          );

          if (hasSets) {
            toPrompt.push({
              id: session.id,
              muscleGroup: session.muscleGroup,
              date: session.date,
            });
          } else {
            toDelete.push(session.id);
          }
        }

        await Promise.all(
          toDelete.map((id) =>
            fetch(`${API_URL}/sessions/${id}`, { method: "DELETE" }),
          ),
        );

        if (toPrompt.length > 0) setAbandonedQueue(toPrompt);
      } catch (err) {
        console.error(err);
      }
    };
    checkAbandoned();
  }, []);

  useEffect(() => {
    if (prQueue.length === 0) return;
    const timeout = setTimeout(
      () => setPrQueue((prev) => prev.slice(1)),
      4000,
    );
    return () => clearTimeout(timeout);
  }, [prQueue]);

  // Show the workout summary once any PR celebrations have finished playing.
  useEffect(() => {
    if (prQueue.length === 0 && pendingSummary) {
      setWorkoutSummary(pendingSummary);
      setPendingSummary(null);
    }
  }, [prQueue, pendingSummary]);

  // Onboarding + body weight check
  useEffect(() => {
    const onboardingDone = localStorage.getItem(`onboardingDone_${userId}`);
    if (!onboardingDone) {
      setShowWelcome(true);
      return;
    }

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

  const handleWelcomeNext = () => {
    setShowWelcome(false);
    setShowOnboardingWeight(true);
    localStorage.setItem(`onboardingDone_${userId}`, "true");
  };

  const handleOnboardingWeightSave = async () => {
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
    } catch (err) {
      console.error(err);
    }

    setShowOnboardingWeight(false);
    setBodyWeight("");
    setShowTour(true);
  };

  const handleOnboardingWeightSkip = () => {
    setShowOnboardingWeight(false);
    setShowTour(true);
  };

  // Tour refs
  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);

  const dashboardTourSteps = [
    {
      title: t("dashboard.tour.week.title"),
      description: t("dashboard.tour.week.desc"),
      refIndex: 0,
    },
    {
      title: t("dashboard.tour.muscleGroups.title"),
      description: t("dashboard.tour.muscleGroups.desc"),
      refIndex: 1,
    },
    {
      title: t("dashboard.tour.activity.title"),
      description: t("dashboard.tour.activity.desc"),
      refIndex: 2,
    },
    {
      title: t("dashboard.tour.home.title"),
      description: t("dashboard.tour.home.desc"),
      selector: "[data-tour='nav-accueil']",
      tooltipPosition: "above" as const,
    },
    {
      title: t("dashboard.tour.stats.title"),
      description: t("dashboard.tour.stats.desc"),
      selector: "[data-tour='nav-stats']",
      tooltipPosition: "above" as const,
    },
    {
      title: t("dashboard.tour.records.title"),
      description: t("dashboard.tour.records.desc"),
      selector: "[data-tour='nav-records']",
      tooltipPosition: "above" as const,
    },
    {
      title: t("dashboard.tour.history.title"),
      description: t("dashboard.tour.history.desc"),
      selector: "[data-tour='nav-historique']",
      tooltipPosition: "above" as const,
    },
    {
      title: t("dashboard.tour.profile.title"),
      description: t("dashboard.tour.profile.desc"),
      selector: "[data-tour='nav-profil']",
      tooltipPosition: "above" as const,
    },
  ];

  const handleResumeAbandoned = (session: AbandonedSession) => {
    setAbandonedQueue((prev) => prev.filter((s) => s.id !== session.id));
    navigate(`/session/${session.id}`);
  };

  const handleFinishAbandoned = async (session: AbandonedSession) => {
    try {
      await fetch(`${API_URL}/sessions/${session.id}/complete`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error(err);
    }
    setAbandonedQueue((prev) => prev.filter((s) => s.id !== session.id));
    setRefreshKey((prev) => prev + 1);
  };

  const handleEndSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const sessionsRes = await fetch(`${API_URL}/sessions/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newPRs: PRCelebrationData[] = [];
      const allPRs: PRCelebrationData[] = [];
      let summary: WorkoutSummaryData | null = null;

      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        const unit = getWeightUnit();

        // For the "vs last time" deltas shown in the recap: the most recent
        // already-completed session (before this end-of-session action)
        // that has a real working set for a given exercise. Also the source
        // for the PR baseline below — deliberately excludes the session(s)
        // being finished right now, since a set's "completed" flag is set
        // the moment it's validated (independent of the session itself
        // being marked complete), so a PR set the user already validated
        // live during this very session would otherwise poison its own
        // baseline and never register as a record.
        type SessionWithSets = {
          completed: boolean;
          date: string;
          sessionExercises: {
            exercise: { id: string; name: string };
            sets: {
              weight: number;
              reps: number;
              completed: boolean;
              type: string;
            }[];
          }[];
        };

        const completedSessions = (sessions as SessionWithSets[])
          .filter((s) => s.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const isWorkingSet = (s: { weight: number; reps: number; type: string }) =>
          s.type !== "warmup" && (s.weight > 0 || s.reps > 0);

        // Baseline: best weight ever validated, from sessions already
        // completed before this one.
        const bestByExercise: Record<string, number> = {};
        for (const session of completedSessions) {
          for (const se of session.sessionExercises) {
            for (const set of se.sets) {
              if (!set.completed || set.type === "warmup") continue;
              const current = bestByExercise[se.exercise.id] ?? 0;
              if (set.weight > current) {
                bestByExercise[se.exercise.id] = set.weight;
              }
            }
          }
        }
        // Snapshot of exercises with a prior record — an exercise never
        // done before has no prior record to beat, so it shouldn't count
        // as a PR the very first time it's logged.
        const hadPriorRecord = new Set(Object.keys(bestByExercise));

        const findPreviousMax = (exerciseId: string): number | null => {
          for (const session of completedSessions) {
            const match = session.sessionExercises.find(
              (se) => se.exercise.id === exerciseId,
            );
            if (!match) continue;
            const working = match.sets.filter(isWorkingSet);
            if (working.length === 0) continue;
            return Math.max(...working.map((s) => s.weight));
          }
          return null;
        };

        const currentMaxByExercise: Record<
          string,
          { name: string; weight: number }
        > = {};

        let totalSets = 0;
        let totalExercises = 0;
        const muscleGroups: string[] = [];
        let earliestDate: Date | null = null;

        for (const session of sessions) {
          if (session.completed) continue;

          const hasSets = session.sessionExercises.some(
            (se: { sets: { weight: number; reps: number }[] }) =>
              se.sets.length > 0,
          );

          if (hasSets) {
            const sessionDate = new Date(session.date);
            if (!earliestDate || sessionDate < earliestDate) {
              earliestDate = sessionDate;
            }
            muscleGroups.push(session.muscleGroup);

            for (const se of session.sessionExercises as {
              exercise: { id: string; name: string };
              sets: {
                weight: number;
                reps: number;
                completed: boolean;
                type: string;
              }[];
            }[]) {
              const performedSets = se.sets.filter(
                (s) => s.weight > 0 || s.reps > 0,
              );
              if (performedSets.length > 0) totalExercises += 1;

              const workingSets = performedSets.filter(isWorkingSet);
              if (workingSets.length > 0) {
                const maxWeight = Math.max(...workingSets.map((s) => s.weight));
                const existing = currentMaxByExercise[se.exercise.id];
                if (!existing || maxWeight > existing.weight) {
                  currentMaxByExercise[se.exercise.id] = {
                    name: se.exercise.name,
                    weight: maxWeight,
                  };
                }
              }

              for (const set of performedSets) {
                totalSets += 1;

                if (set.weight <= 0 || set.type === "warmup") continue;
                const previousBest = bestByExercise[se.exercise.id] ?? 0;
                if (set.weight > previousBest) {
                  bestByExercise[se.exercise.id] = set.weight;
                  if (hadPriorRecord.has(se.exercise.id)) {
                    const pr = {
                      exerciseName: se.exercise.name,
                      weight: set.weight,
                      unit,
                    };
                    allPRs.push(pr);
                    // Sets validated via the checkmark already got a live
                    // celebration on the Session page — only queue a popup
                    // here for ones that slipped through without ever
                    // being tapped "Valider".
                    if (!set.completed) {
                      newPRs.push(pr);
                    }
                  }
                }
              }
            }

            await fetch(`${API_URL}/sessions/${session.id}/complete`, {
              method: "PATCH",
            });
          } else {
            await fetch(`${API_URL}/sessions/${session.id}`, {
              method: "DELETE",
            });
          }
        }

        const exerciseDeltas: { exerciseName: string; delta: number; unit: string }[] =
          [];
        for (const exerciseId of Object.keys(currentMaxByExercise)) {
          const { name, weight } = currentMaxByExercise[exerciseId];
          const previousMax = findPreviousMax(exerciseId);
          if (previousMax === null) continue;
          const diff = Math.round((weight - previousMax) * 10) / 10;
          if (diff !== 0) {
            exerciseDeltas.push({ exerciseName: name, delta: diff, unit });
          }
        }

        // Only worth showing a recap if at least one set has real weight/reps
        // data — a session with only empty, never-filled-in set rows still
        // gets marked complete above, but there's nothing to summarize.
        summary =
          muscleGroups.length === 0 || totalSets === 0
            ? null
            : {
                muscleGroups: [...new Set(muscleGroups)],
                date: (earliestDate ?? new Date()).toISOString(),
                durationMinutes: earliestDate
                  ? Math.max(
                      1,
                      Math.round(
                        (Date.now() - earliestDate.getTime()) / 60000,
                      ),
                    )
                  : 0,
                totalSets,
                totalExercises,
                prs: allPRs,
                exerciseDeltas,
              };
      }

      setShowEndConfirm(false);
      setRefreshKey((prev) => prev + 1);

      if (summary) {
        if (newPRs.length > 0) {
          setPrQueue(newPRs);
          setPendingSummary(summary);
        } else {
          setWorkoutSummary(summary);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWeight = async () => {
    const token = localStorage.getItem("token");
    if (!token || !bodyWeight) return;

    try {
      if (promptUnit !== getWeightUnit()) {
        const unitRes = await fetch(`${API_URL}/auth/weight-unit`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ weightUnit: promptUnit }),
        });
        if (unitRes.ok) {
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            u.weightUnit = promptUnit;
            localStorage.setItem("user", JSON.stringify(u));
          }
        }
      }

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
    <div className="pb-28 bg-[#faf6f1] min-h-screen">
      <HeaderDashboard />
      <div ref={tourRef0}>
        <WeekProgress
          weekActive={weekActive}
          setWeekActive={handleSetWeekActive}
        />
      </div>
      <div ref={tourRef1}>
        <MuscleGroupsCards weekActive={weekActive} refreshKey={refreshKey} />
      </div>
      <div ref={tourRef2}>
        <RecentActivity />
      </div>

      {weekActive && (
        <div className="px-5 mt-6">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-full bg-[#191714] active:scale-[0.98] text-white py-4 rounded-full font-bold uppercase tracking-wide text-sm transition-all flex items-center justify-center shadow-sm"
          >
            {t("dashboard.finishSession")}
          </button>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-[#faf6f1] rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div
              className="px-6 pt-7 pb-6 text-center"
              style={{ background: "#191714" }}
            >
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                {t("dashboard.finishSessionTitle")}
              </h2>
            </div>

            <div className="px-5 pt-5 pb-6">
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                {t("dashboard.finishSessionBody")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 bg-[#ece7dd] text-gray-700 py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-80"
                >
                  {t("dashboard.cancel")}
                </button>
                <button
                  onClick={handleEndSession}
                  className="flex-1 bg-[#3a9e6e] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} strokeWidth={3} />
                  {t("dashboard.finish")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {abandonedQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              {t("dashboard.abandoned.title", {
                group: abandonedQueue[0].muscleGroup,
              })}
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              {t("dashboard.abandoned.body", {
                group: abandonedQueue[0].muscleGroup,
                date: formatAbandonedDate(abandonedQueue[0].date),
              })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleFinishAbandoned(abandonedQueue[0])}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                {t("dashboard.finish")}
              </button>
              <button
                onClick={() => handleResumeAbandoned(abandonedQueue[0])}
                className="flex-1 bg-[#c9552c] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {t("dashboard.resume")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeightPrompt && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-[#faf6f1] rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div
              className="px-6 pt-8 pb-6 text-center"
              style={{ background: "#191714" }}
            >
              <div className="w-14 h-14 rounded-full bg-[#3d271a] flex items-center justify-center mx-auto mb-4">
                <Scale size={24} className="text-[#f0994a]" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                {t("dashboard.weightPrompt.title")}
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {t("dashboard.weightPrompt.subtitle")}
              </p>
            </div>

            <div className="px-5 pt-5 pb-6">
              <div className="flex items-center justify-between bg-[#ece7dd] rounded-full pl-5 pr-1.5 py-1.5 mb-5">
                <input
                  type="number"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-20 bg-transparent text-4xl font-black text-gray-900 placeholder-gray-300 focus:outline-none"
                />
                <div className="relative flex w-28 bg-gray-300 rounded-full p-1">
                  <div
                    className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#191714] transition-transform duration-200 ease-out"
                    style={{
                      transform:
                        promptUnit === "kg" ? "translateX(100%)" : "translateX(0)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPromptUnit("lb")}
                    className={`relative z-10 flex-1 py-2 rounded-full text-xs font-bold uppercase transition-colors ${
                      promptUnit === "lb" ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Lb
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromptUnit("kg")}
                    className={`relative z-10 flex-1 py-2 rounded-full text-xs font-bold uppercase transition-colors ${
                      promptUnit === "kg" ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Kg
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSnoozeWeight}
                  className="flex-1 bg-[#ece7dd] text-gray-700 py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-80"
                >
                  {t("dashboard.weightPrompt.later")}
                </button>
                <button
                  onClick={handleSaveWeight}
                  disabled={!bodyWeight}
                  className="flex-1 bg-[#191714] disabled:opacity-40 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-colors active:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Check size={16} strokeWidth={3} />
                  {t("dashboard.weightPrompt.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome overlay */}
      {showWelcome && (
        <div className="fixed inset-0 bg-[#faf6f1] z-50 flex flex-col items-center justify-center px-8 animate-fade-in">
          <img
            src="/LogoGymsTrack5.webp"
            alt="GymsTrack"
            className="h-20 mb-6"
          />
          <h1 className="text-2xl font-black text-gray-900 text-center mb-2">
            {t("dashboard.welcome.title", { name: userName })}
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">
            {t("dashboard.welcome.subtitle")}
          </p>
          <button
            onClick={handleWelcomeNext}
            className="w-full max-w-xs bg-[#c9552c] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {t("dashboard.welcome.start")}
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Onboarding weight prompt */}
      {showOnboardingWeight && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Scale size={24} className="text-orange-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 text-center">
                {t("dashboard.onboardingWeight.title")}
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                {t("dashboard.onboardingWeight.subtitle")}
              </p>
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-500 transition-colors"
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
                onClick={handleOnboardingWeightSkip}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                {t("dashboard.onboardingWeight.skip")}
              </button>
              <button
                onClick={handleOnboardingWeightSave}
                disabled={!bodyWeight}
                className="flex-1 bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {t("dashboard.onboardingWeight.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour guidé */}
      {showTour && (
        <TourOverlay
          tourKey={`dashboard_${userId}`}
          steps={dashboardTourSteps}
          refs={[tourRef0, tourRef1, tourRef2]}
        />
      )}

      {prQueue.length > 0 && (
        <PRCelebration
          exerciseName={prQueue[0].exerciseName}
          weight={prQueue[0].weight}
          unit={prQueue[0].unit}
          onClose={() => setPrQueue((prev) => prev.slice(1))}
        />
      )}

      {workoutSummary && (
        <WorkoutSummary
          muscleGroups={workoutSummary.muscleGroups}
          date={workoutSummary.date}
          durationMinutes={workoutSummary.durationMinutes}
          totalSets={workoutSummary.totalSets}
          totalExercises={workoutSummary.totalExercises}
          prs={workoutSummary.prs}
          exerciseDeltas={workoutSummary.exerciseDeltas}
          onClose={() => setWorkoutSummary(null)}
        />
      )}
    </div>
  );
}
