import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Dumbbell, Crown } from "lucide-react";
import {
  getWeightUnit,
  getRestTimerSeconds,
  getRestTimerEnabled,
  getBarbellModeEnabled,
} from "../utils/units";
import { API_URL } from "../lib/api";
import { getDateLocale } from "../i18n";
import { useExerciseHistory } from "../hooks/useExerciseDeltas";
import { useRestTimerContext } from "../contexts/RestTimerContext";
import { useTrackedExercises } from "../hooks/useTrackedExercises";
import { useExerciseNotes } from "../hooks/useExerciseNotes";
import { useSupersetManager } from "../hooks/useSupersetManager";
import { useToast } from "../hooks/useToast";
import { useIsPro } from "../hooks/useIsPro";
import { getDefaultBarWeight } from "../utils/plates";
import { inferLoadingType, isLoadingType, type LoadingType } from "../utils/loadingType";
import { useExerciseLoadingTypes } from "../hooks/useExerciseLoadingTypes";
import type { WarmupSetPlan } from "../utils/warmup";
import PRCelebration from "../components/session/PRCelebration";
import Toast from "../components/Toast";
import TourOverlay from "../components/TourOverlay";
import ExerciseReorderList from "../components/session/ExerciseReorderList";
import ExerciseCard from "../components/session/ExerciseCard";
import AddExercisePanel from "../components/session/AddExercisePanel";
import ExerciseSuggestions from "../components/session/ExerciseSuggestions";
import SupersetModal from "../components/session/SupersetModal";
import NoteModal from "../components/session/NoteModal";
import DeleteExerciseModal from "../components/session/DeleteExerciseModal";
import WarmupModal from "../components/session/WarmupModal";
import { POPULAR_EXERCISES_BY_MUSCLE_GROUP } from "../utils/popularExercises";
import { getMuscleGroupLabel } from "../utils/muscleGroupLabel";
import { offlineAwareFetch } from "../lib/offlineFetch";
import { getOfflineDb } from "../lib/offlineDb";
import { onSyncQueueChange } from "../lib/syncQueue";
import type {
  SetData,
  SessionExercise,
  SessionData,
  AvailableExercise,
  LastWeight,
} from "../types/session";

const SUPERSET_COLORS = ["#c9552c", "#2b6cb0", "#3a9e6e", "#9333ea", "#c026d3"];

const getSupersetColor = (supersetId: string) => {
  let hash = 0;
  for (const char of supersetId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SUPERSET_COLORS[hash % SUPERSET_COLORS.length];
};

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get("readonly") === "true";

  const [session, setSession] = useState<SessionData | null>(null);
  const [exercises, setExercises] = useState<AvailableExercise[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastWeights, setLastWeights] = useState<LastWeight[]>([]);
  const [exerciseDurations, setExerciseDurations] = useState<
    Record<string, number>
  >({});
  const [barWeights, setBarWeights] = useState<Record<string, number>>({});
  const [personalRecords, setPersonalRecords] = useState<
    Record<string, number>
  >({});
  const [prCelebration, setPrCelebration] = useState<{
    exerciseName: string;
    weight: number;
    unit: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openSetTypeMenu, setOpenSetTypeMenu] = useState<string | null>(null);
  const [closingSetTypeMenu, setClosingSetTypeMenu] = useState<string | null>(
    null,
  );
  const [warmupModalFor, setWarmupModalFor] = useState<string | null>(null);
  const [showSetRowTour, setShowSetRowTour] = useState(false);
  const sessionRef = useRef<SessionData | null>(null);
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { deltas, lastTimes } = useExerciseHistory(sessionId);
  const restTimer = useRestTimerContext();
  const { isPro } = useIsPro();
  const restTimerEnabled = getRestTimerEnabled();
  // Loading-type inputs (bar + plates, per side, per dumbbell…) are Pro. A
  // lapsed subscription must stop surfacing them immediately even though
  // the stored preference boolean itself is still `true`.
  const loadingTypesEnabled = getBarbellModeEnabled() && isPro;
  const { loadingTypeOverrides, fetchLoadingTypes, saveLoadingType } =
    useExerciseLoadingTypes();

  const { isTracked, fetchTracked, toggleTracked } = useTrackedExercises();
  const {
    noteModalFor,
    noteDraft,
    setNoteDraft,
    getNote,
    fetchExerciseNotes,
    openNoteModal,
    closeNoteModal,
    saveNote,
  } = useExerciseNotes();

  const fetchSession = async () => {
    if (!sessionId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Completed sessions past the free plan's 90-day window are Pro-only
      // (reachable e.g. from an exercise's history list) — send the user to
      // the upgrade page rather than falling back to a cached copy below.
      if (res.status === 403) {
        const body = await res.json().catch(() => null);
        if (body?.proRequired) {
          navigate("/upgrade", { replace: true });
          return;
        }
      }
      if (!res.ok) throw new Error("Session introuvable");
      const data = await res.json();
      setSession(data);
      const db = await getOfflineDb();
      await db.put("sessionCache", {
        sessionId,
        data,
        cachedAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
      // No connection — fall back to whatever we last saw for this session
      // instead of leaving the page stuck on a spinner.
      const db = await getOfflineDb();
      const cached = await db.get("sessionCache", sessionId);
      if (cached) setSession(cached.data as SessionData);
    } finally {
      setLoading(false);
    }
  };

  const {
    supersetModalFor,
    supersetSelection,
    openSupersetModal,
    closeSupersetModal,
    toggleSupersetSelection,
    confirmSuperset,
  } = useSupersetManager(session, fetchSession);

  const { toast, closingToast, showToast } = useToast();

  const getExerciseDuration = (sessionExerciseId: string) =>
    exerciseDurations[sessionExerciseId] ?? getRestTimerSeconds();

  const closeSetTypeMenu = () => {
    setOpenSetTypeMenu((current) => {
      if (!current) return current;
      setClosingSetTypeMenu(current);
      setTimeout(() => setClosingSetTypeMenu(null), 150);
      return null;
    });
  };

  // The user's own choice for this exercise wins, then the curated type
  // stored on the exercise, then a guess from its name.
  const getLoadingType = (se: SessionExercise): LoadingType =>
    loadingTypeOverrides[se.exercise.id] ??
    (isLoadingType(se.exercise.loadingType)
      ? se.exercise.loadingType
      : inferLoadingType(se.exercise.name));

  const getBarWeight = (sessionExerciseId: string) =>
    barWeights[sessionExerciseId] ?? getDefaultBarWeight(getWeightUnit());

  const fetchPersonalRecords = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/sessions/me/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const records: { exerciseId: string; weight: number }[] =
        await res.json();
      const map: Record<string, number> = {};
      for (const r of records) map[r.exerciseId] = r.weight;
      setPersonalRecords(map);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExercises = async (muscleGroupName: string) => {
    try {
      const res = await fetch(`${API_URL}/exercises`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return;
      const all: AvailableExercise[] = await res.json();
      setExercises(
        all.filter(
          (e) =>
            e.muscleGroup.name.toLowerCase() === muscleGroupName.toLowerCase(),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLastWeights = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/sessions/me?start=2000-01-01T00:00:00.000Z&end=${new Date().toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) return;
      const sessions: SessionData[] = await res.json();

      const weightMap = new Map<string, number>();
      for (const s of sessions) {
        for (const se of s.sessionExercises) {
          for (const set of se.sets) {
            const current = weightMap.get(se.exercise.id) || 0;
            if (set.weight > current) {
              weightMap.set(se.exercise.id, set.weight);
            }
          }
        }
      }

      setLastWeights(
        Array.from(weightMap.entries()).map(([exerciseId, weight]) => ({
          exerciseId,
          weight,
        })),
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchLastWeights();
    fetchTracked();
    fetchPersonalRecords();
    fetchExerciseNotes();
    fetchLoadingTypes();
  }, [sessionId]);

  // Once every queued offline write has synced, refetch so temporary
  // (offline-created) set ids get replaced by the server's real ones.
  useEffect(() => {
    return onSyncQueueChange((pending) => {
      if (pending === 0) fetchSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!prCelebration) return;
    const timeout = setTimeout(() => setPrCelebration(null), 4000);
    return () => clearTimeout(timeout);
  }, [prCelebration]);

  useEffect(() => {
    if (session) {
      fetchExercises(session.muscleGroup);
    }
  }, [session?.muscleGroup]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const saveExerciseOrder = async (order: string[]) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/session-exercises/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order }),
      });
    } catch (err) {
      console.error(err);
      fetchSession();
    }
  };

  const addExercise = async (exerciseId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/session-exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, exerciseId }),
      });
      if (!res.ok) throw new Error("Erreur ajout exercice");
      fetchSession();
    } catch (err) {
      console.error(err);
    }
  };

  const addSet = async (sessionExerciseId: string, sets: SetData[]) => {
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const payload = {
      sessionExerciseId,
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
      unit: lastSet ? lastSet.unit : getWeightUnit(),
    };

    const result = await offlineAwareFetch("POST", "/sets", payload, "Nouveau set");

    if (result.queued) {
      // No connection — insert locally with a temporary id so the set shows
      // up right away; a real id replaces it once the queued request syncs
      // and we refetch (see syncQueue.ts).
      const tempSet: SetData = {
        id: `temp-${crypto.randomUUID()}`,
        ...payload,
        completed: false,
        type: "normal",
      };
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sessionExercises: prev.sessionExercises.map((se) =>
            se.id === sessionExerciseId
              ? { ...se, sets: [...se.sets, tempSet] }
              : se,
          ),
        };
      });
      setShowSetRowTour(true);
      return;
    }

    if (!result.response.ok) {
      console.error("Erreur ajout set");
      return;
    }
    fetchSession();
    setShowSetRowTour(true);
  };

  const generateWarmup = async (
    sessionExerciseId: string,
    workingWeight: number,
    workingReps: number,
    plan: WarmupSetPlan[],
  ) => {
    setWarmupModalFor(null);
    const unit = getWeightUnit();

    try {
      const token = localStorage.getItem("token");
      for (const step of plan) {
        await fetch(`${API_URL}/sets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionExerciseId,
            weight: step.weight,
            reps: step.reps,
            unit,
            type: "warmup",
          }),
        });
      }
      await fetch(`${API_URL}/sets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionExerciseId,
          weight: workingWeight,
          reps: workingReps,
          unit,
        }),
      });
      showToast(t("session.warmupGenerated"));
      fetchSession();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSetCompleted = (set: SetData, se: SessionExercise) => {
    const nextCompleted = !set.completed;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionExercises: prev.sessionExercises.map((s) => ({
          ...s,
          sets: s.sets.map((st) =>
            st.id === set.id ? { ...st, completed: nextCompleted } : st,
          ),
        })),
      };
    });

    // Start the timer synchronously (same click) so browsers still treat
    // sound/vibration triggered later as originating from a user gesture.
    // A drop set chains immediately into the next weight with no rest, so
    // it never starts the timer. In a superset, the timer only starts once
    // every exercise in the group has a completed set for this "round".
    if (nextCompleted && restTimerEnabled && set.type !== "dropset") {
      const group = se.supersetId
        ? (session?.sessionExercises.filter(
            (s) => s.supersetId === se.supersetId,
          ) ?? [])
        : [];

      if (group.length < 2) {
        restTimer.start(getExerciseDuration(se.id));
      } else {
        const myCount =
          se.sets.filter((s) => s.completed).length + 1; // this toggle isn't reflected in `session` yet
        const roundComplete = group.every(
          (g) =>
            g.id === se.id ||
            g.sets.filter((s) => s.completed).length >= myCount,
        );
        if (roundComplete) {
          restTimer.start(getExerciseDuration(se.id));
        }
      }
    }

    // Superset: auto-advance to the next exercise in the rotation.
    if (nextCompleted && se.supersetId && session) {
      const group = session.sessionExercises.filter(
        (s) => s.supersetId === se.supersetId,
      );
      if (group.length > 1) {
        const idx = group.findIndex((g) => g.id === se.id);
        const next = group[(idx + 1) % group.length];
        requestAnimationFrame(() => {
          exerciseRefs.current[next.id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
    }

    // Warm-up sets don't count toward personal records. And the very first
    // time an exercise is ever logged, there's no prior record to beat, so
    // it shouldn't trigger a celebration — only genuine improvements should.
    if (nextCompleted && set.type !== "warmup" && set.weight > 0) {
      const hadPreviousRecord = se.exercise.id in personalRecords;
      const previousBest = personalRecords[se.exercise.id] ?? 0;
      if (set.weight > previousBest) {
        setPersonalRecords((prev) => ({
          ...prev,
          [se.exercise.id]: set.weight,
        }));
        if (hadPreviousRecord) {
          setPrCelebration({
            exerciseName: se.exercise.name,
            weight: set.weight,
            unit: getWeightUnit(),
          });
        }
      }
    }

    // A set created offline only exists locally so far (see addSet) — there's
    // no real id yet to send a PATCH for; the local toggle above is enough,
    // it'll be included whenever the create itself finally syncs.
    if (set.id.startsWith("temp-")) return;

    offlineAwareFetch(
      "PATCH",
      `/sets/${set.id}`,
      { completed: nextCompleted },
      "Set complété",
    ).then((result) => {
      // A queued (offline) request keeps the optimistic update above as-is;
      // a real server error reverts it by refetching the true state.
      if (!result.queued && !result.response.ok) {
        fetchSession();
      }
    });
  };

  const updateSet = async (
    setId: string,
    data: { weight?: number; reps?: number; type?: string },
  ) => {
    // Optimistic update first for instant UI feedback
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionExercises: prev.sessionExercises.map((se) => ({
          ...se,
          sets: se.sets.map((s) => (s.id === setId ? { ...s, ...data } : s)),
        })),
      };
    });

    // Same reasoning as toggleSetCompleted — a not-yet-synced set has no
    // real id on the server to PATCH.
    if (setId.startsWith("temp-")) return;

    const result = await offlineAwareFetch(
      "PATCH",
      `/sets/${setId}`,
      data,
      "Modification set",
    );
    if (!result.queued && !result.response.ok) {
      fetchSession();
    }
  };

  const setLocalWeight = (setId: string, weight: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionExercises: prev.sessionExercises.map((s) => ({
          ...s,
          sets: s.sets.map((st) =>
            st.id === setId ? { ...st, weight } : st,
          ),
        })),
      };
    });
  };

  const setLocalReps = (setId: string, reps: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionExercises: prev.sessionExercises.map((s) => ({
          ...s,
          sets: s.sets.map((st) => (st.id === setId ? { ...st, reps } : st)),
        })),
      };
    });
  };

  const deleteSet = async (setId: string) => {
    // Optimistic removal first, same pattern as updateSet.
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionExercises: prev.sessionExercises.map((se) => ({
          ...se,
          sets: se.sets.filter((s) => s.id !== setId),
        })),
      };
    });

    // A set added while offline only ever existed locally — there's nothing
    // to delete on the server, and no real id to queue a DELETE for.
    if (setId.startsWith("temp-")) return;

    const result = await offlineAwareFetch(
      "DELETE",
      `/sets/${setId}`,
      undefined,
      "Suppression set",
    );
    // Queued: keep the optimistic removal. Otherwise (success or real
    // error), refetch — either to get the server's confirmed state, or to
    // revert the optimistic removal if the delete actually failed.
    if (!result.queued) {
      fetchSession();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-gray-400">{t("session.loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-red-400">{t("session.notFound")}</p>
      </div>
    );
  }

  const addedIds = session.sessionExercises.map((se) => se.exercise.id);
  const availableExercises = exercises.filter((e) => !addedIds.includes(e.id));

  const groupPopular = POPULAR_EXERCISES_BY_MUSCLE_GROUP[session.muscleGroup] || [];
  const popularSuggestions = availableExercises
    .filter((ex) =>
      groupPopular.some((p) => ex.name.toLowerCase().includes(p.toLowerCase())),
    )
    .slice(0, 5);
  const suggestions =
    popularSuggestions.length > 0
      ? popularSuggestions
      : availableExercises.slice(0, 5);

  const isEmpty = session.sessionExercises.length === 0;

  const formattedDate = new Date(session.date).toLocaleDateString(
    getDateLocale(),
    { weekday: "long", day: "numeric", month: "long" },
  );
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const unit = getWeightUnit();

  const sessionTourSteps = [
    {
      title: t("session.tour.back.title"),
      description: t("session.tour.back.desc"),
      selector: "[data-tour='session-back']",
    },
    {
      title: t("session.tour.addExercise.title"),
      description: t("session.tour.addExercise.desc"),
      selector: "[data-tour='session-add-exercise']",
    },
    {
      title: t("session.tour.reorder.title"),
      description: t("session.tour.reorder.desc"),
      selector: "[data-tour='session-edit-toggle']",
    },
    {
      title: t("session.tour.trophy.title"),
      description: t("session.tour.trophy.desc"),
      selector: "[data-tour='session-trophy']",
    },
    {
      title: t("session.tour.more.title"),
      description: t("session.tour.more.desc"),
      selector: "[data-tour='session-more']",
    },
    ...(loadingTypesEnabled
      ? [
          {
            title: t("session.tour.barMode.title"),
            description: t("session.tour.barMode.desc"),
            selector: "[data-tour='session-loading-chip']",
          },
        ]
      : []),
    ...(restTimerEnabled && isPro
      ? [
          {
            title: t("session.tour.rest.title"),
            description: t("session.tour.rest.desc"),
            selector: "[data-tour='session-rest-chip']",
          },
        ]
      : []),
    {
      title: t("session.tour.warmup.title"),
      description: t("session.tour.warmup.desc"),
      selector: "[data-tour='session-warmup']",
    },
    {
      title: t("session.tour.addSet.title"),
      description: t("session.tour.addSet.desc"),
      selector: "[data-tour='session-add-set']",
    },
    {
      title: t("session.tour.finishExercises.title"),
      description: t("session.tour.finishExercises.desc"),
      selector: "[data-tour='session-finish-exercises']",
    },
  ];

  // Contextual mini-tour that explains a set row's own controls, triggered
  // right after the user adds their first set rather than on page load —
  // there's nothing to point at until a set actually exists.
  const setRowTourSteps = [
    {
      title: t("session.setRowTour.weight.title"),
      description: t("session.setRowTour.weight.desc"),
      selector: "[data-tour='session-set-weight']",
    },
    {
      title: t("session.setRowTour.reps.title"),
      description: t("session.setRowTour.reps.desc"),
      selector: "[data-tour='session-set-reps']",
    },
    {
      title: t("session.setRowTour.type.title"),
      description: t("session.setRowTour.type.desc"),
      selector: "[data-tour='session-set-type']",
    },
    {
      title: t("session.setRowTour.check.title"),
      description: t("session.setRowTour.check.desc"),
      selector: "[data-tour='session-set-check']",
    },
    {
      title: t("session.setRowTour.delete.title"),
      description: t("session.setRowTour.delete.desc"),
      selector: "[data-tour='session-set-delete']",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-8">
      <div
        className="flex items-center justify-between gap-3 px-5 pt-8 pb-6"
        style={{ background: "#191714" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            data-tour="session-back"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white uppercase tracking-wide leading-tight truncate">
              {getMuscleGroupLabel(session.muscleGroup, t)}
            </h1>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-0.5">
              {capitalizedDate}
            </p>
          </div>
        </div>

        {!readOnly && !isEmpty ? (
          <button
            data-tour="session-edit-toggle"
            onClick={() =>
              isPro ? setIsEditMode((v) => !v) : navigate("/upgrade")
            }
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3.5 py-2 rounded-full transition-colors flex-shrink-0 ${
              isEditMode ? "bg-[#c9552c] text-white" : "bg-white/10 text-white"
            }`}
          >
            {!isPro && <Crown size={12} />}
            {isEditMode ? t("session.done") : t("session.edit")}
          </button>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-[#c9552c]/15 text-[#c9552c] px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap">
            {t("session.exerciseCountBadge", {
              count: session.sessionExercises.length,
            })}
          </span>
        )}
      </div>

      <div className="px-5 pt-5 space-y-4">
        {!readOnly && !isEditMode && (
          <AddExercisePanel
            muscleGroup={session.muscleGroup}
            availableExercises={availableExercises}
            onAdd={addExercise}
          />
        )}

        {isEmpty && (
          <div className="bg-[#ece7dd] border-2 border-dashed border-[#d6d0c1] rounded-3xl p-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mb-3">
              <Dumbbell size={20} className="text-[#c9552c]" />
            </div>
            <p className="text-sm font-black text-gray-900 uppercase mb-1">
              {t("session.emptyTitle")}
            </p>
            <p className="text-xs text-gray-500 text-center whitespace-pre-line">
              {t("session.emptyDesc")}
            </p>
          </div>
        )}

        {isEditMode && (
          <ExerciseReorderList
            exercises={session.sessionExercises}
            onReorderLive={(next) =>
              setSession((prev) => (prev ? { ...prev, sessionExercises: next } : prev))
            }
            onDrop={saveExerciseOrder}
          />
        )}

        {!isEditMode &&
          session.sessionExercises.map((se, seIndex) => {
            const loadingType = loadingTypesEnabled ? getLoadingType(se) : null;
            const barWeight = getBarWeight(se.id);
            const delta = deltas.get(se.exercise.id);
            const lastTime = lastTimes.get(se.exercise.id);
            const supersetGroup = se.supersetId
              ? session.sessionExercises.filter(
                  (s) => s.supersetId === se.supersetId,
                )
              : [];
            const supersetColor = se.supersetId
              ? getSupersetColor(se.supersetId)
              : null;
            const supersetPosition = supersetGroup.findIndex(
              (g) => g.id === se.id,
            );

            return (
              <ExerciseCard
                key={se.id}
                se={se}
                seIndex={seIndex}
                totalExercises={session.sessionExercises.length}
                loadingType={loadingType}
                barWeight={barWeight}
                unit={unit}
                readOnly={readOnly}
                isPro={isPro}
                isLoadingTypeOverridden={
                  se.exercise.id in loadingTypeOverrides
                }
                restTimerEnabled={restTimerEnabled}
                exerciseDuration={getExerciseDuration(se.id)}
                delta={delta}
                lastTime={lastTime}
                isTracked={isTracked(se.exercise.id)}
                note={getNote(se.exercise.id)}
                supersetColor={supersetColor}
                supersetPosition={supersetPosition}
                supersetGroupLength={supersetGroup.length}
                isRemoving={removingId === se.id}
                animationDelay={seIndex * 80}
                openSetTypeMenuId={openSetTypeMenu}
                closingSetTypeMenuId={closingSetTypeMenu}
                cardRef={(el) => {
                  exerciseRefs.current[se.id] = el;
                }}
                onToggleTracked={() => {
                  const wasTracked = isTracked(se.exercise.id);
                  toggleTracked(se.exercise.id);
                  showToast(
                    wasTracked
                      ? t("session.trackedRemoved")
                      : t("session.trackedAdded"),
                  );
                }}
                onOpenNoteModal={() => openNoteModal(se.exercise.id)}
                onOpenSupersetModal={() =>
                  isPro ? openSupersetModal(se) : navigate("/upgrade")
                }
                onRequestDelete={() => setConfirmDelete(se.id)}
                onSelectLoadingType={(type) =>
                  saveLoadingType(se.exercise.id, type)
                }
                onSelectDuration={(seconds) => {
                  setExerciseDurations((prev) => ({
                    ...prev,
                    [se.id]: seconds,
                  }));
                }}
                onSelectBarWeight={(weight) =>
                  setBarWeights((prev) => ({ ...prev, [se.id]: weight }))
                }
                onToggleSetTypeMenu={(setId) =>
                  openSetTypeMenu === setId
                    ? closeSetTypeMenu()
                    : setOpenSetTypeMenu(setId)
                }
                onSelectSetType={(setId, type) => {
                  updateSet(setId, { type });
                  closeSetTypeMenu();
                }}
                onLocalWeightChange={setLocalWeight}
                onCommitWeight={(setId, weight) =>
                  updateSet(setId, { weight })
                }
                onLocalRepsChange={setLocalReps}
                onCommitReps={(setId, reps) => updateSet(setId, { reps })}
                onToggleSetCompleted={(set) => toggleSetCompleted(set, se)}
                onDeleteSet={deleteSet}
                onAddSet={() => addSet(se.id, se.sets)}
                onOpenWarmupModal={() =>
                  isPro ? setWarmupModalFor(se.id) : navigate("/upgrade")
                }
              />
            );
          })}

        {!readOnly && !isEmpty && !isEditMode && (
          <button
            data-tour="session-finish-exercises"
            onClick={() => navigate("/dashboard")}
            className="w-full bg-[#191714] active:bg-[#191714]/85 text-white font-bold uppercase text-sm tracking-wide py-4 rounded-2xl transition-colors"
          >
            {t("session.finishExercises")}
          </button>
        )}
      </div>

      {isEmpty && suggestions.length > 0 && !readOnly && (
        <ExerciseSuggestions
          muscleGroup={session.muscleGroup}
          suggestions={suggestions}
          lastWeights={lastWeights}
          unit={unit}
          onAdd={addExercise}
        />
      )}

      {confirmDelete && (
        <DeleteExerciseModal
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try {
              const token = localStorage.getItem("token");
              await fetch(`${API_URL}/session-exercises/${confirmDelete}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              setConfirmDelete(null);
              setRemovingId(confirmDelete);
              showToast(t("session.exerciseDeleted"));
              setTimeout(() => {
                setRemovingId(null);
                fetchSession();
              }, 300);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {prCelebration && (
        <PRCelebration
          exerciseName={prCelebration.exerciseName}
          weight={prCelebration.weight}
          unit={prCelebration.unit}
          onClose={() => setPrCelebration(null)}
        />
      )}

      {supersetModalFor && session && (
        <SupersetModal
          exercises={session.sessionExercises}
          supersetModalFor={supersetModalFor}
          supersetSelection={supersetSelection}
          onToggleSelection={toggleSupersetSelection}
          onClose={closeSupersetModal}
          onConfirm={confirmSuperset}
        />
      )}

      {noteModalFor && session && (
        <NoteModal
          exerciseName={
            session.sessionExercises.find((s) => s.exercise.id === noteModalFor)
              ?.exercise.name
          }
          noteDraft={noteDraft}
          onDraftChange={setNoteDraft}
          onClose={closeNoteModal}
          onSave={saveNote}
        />
      )}

      {warmupModalFor && (
        <WarmupModal
          unit={unit}
          loadingType={(() => {
            const se = session.sessionExercises.find(
              (s) => s.id === warmupModalFor,
            );
            return se && loadingTypesEnabled ? getLoadingType(se) : null;
          })()}
          barWeight={getBarWeight(warmupModalFor)}
          onClose={() => setWarmupModalFor(null)}
          onConfirm={(workingWeight, workingReps, plan) =>
            generateWarmup(warmupModalFor, workingWeight, workingReps, plan)
          }
        />
      )}

      {toast && <Toast message={toast} closing={closingToast} />}

      {!readOnly && !isEmpty && (
        <TourOverlay tourKey="session" steps={sessionTourSteps} />
      )}

      {/* Only once the main page tour is done, so the two never overlap. */}
      {!readOnly && showSetRowTour && localStorage.getItem("tour_session") && (
        <TourOverlay tourKey="session-set-row" steps={setRowTourSteps} />
      )}
    </div>
  );
}
