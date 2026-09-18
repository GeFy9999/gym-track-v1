import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Search,
  Dumbbell,
  Check,
  Timer,
  History,
  X,
  Trophy,
  GripVertical,
  Link2,
  Unlink,
} from "lucide-react";
import {
  getWeightUnit,
  getRestTimerSeconds,
  getRestTimerEnabled,
  getBarbellModeEnabled,
  formatDuration,
} from "../utils/units";
import { API_URL } from "../lib/api";
import { useExerciseHistory, formatLastTime } from "../hooks/useExerciseDeltas";
import { useRestTimerContext } from "../contexts/RestTimerContext";
import {
  isLikelyBarbellExercise,
  getDefaultBarWeight,
  calculatePlates,
  BAR_WEIGHTS,
  MIN_WEIGHT,
  MAX_WEIGHT,
  MIN_REPS,
  MAX_REPS,
} from "../utils/plates";
import PlateRow from "../components/session/PlateRow";
import PRCelebration from "../components/session/PRCelebration";
import {
  SET_TYPE_OPTIONS,
  SET_TYPE_LETTERS,
  getSetTypeColor,
  getSetTypeAccent,
  getSetBadgeLabel,
} from "../utils/setTypes";

const REST_DURATION_OPTIONS = [30, 60, 90, 120, 180];

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const SUPERSET_COLORS = ["#c9552c", "#2b6cb0", "#3a9e6e", "#9333ea", "#c026d3"];

const getSupersetColor = (supersetId: string) => {
  let hash = 0;
  for (const char of supersetId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SUPERSET_COLORS[hash % SUPERSET_COLORS.length];
};

type SetData = {
  id: string;
  weight: number;
  reps: number;
  unit: string;
  completed: boolean;
  type: string;
};

type SessionExercise = {
  id: string;
  exercise: { id: string; name: string; image: string | null };
  sets: SetData[];
  supersetId: string | null;
};

type SessionData = {
  id: string;
  muscleGroup: string;
  completed: boolean;
  date: string;
  sessionExercises: SessionExercise[];
};

type AvailableExercise = {
  id: string;
  name: string;
  image: string | null;
  muscleGroup: { id: string; name: string };
};

type LastWeight = {
  exerciseId: string;
  weight: number;
};

type TrackedExercise = {
  id: string;
  exerciseId: string;
};

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get("readonly") === "true";

  const [session, setSession] = useState<SessionData | null>(null);
  const [exercises, setExercises] = useState<AvailableExercise[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastWeights, setLastWeights] = useState<LastWeight[]>([]);
  const [exerciseDurations, setExerciseDurations] = useState<
    Record<string, number>
  >({});
  const [openDurationPicker, setOpenDurationPicker] = useState<string | null>(
    null,
  );
  const [closingDurationPicker, setClosingDurationPicker] = useState<
    string | null
  >(null);
  const [customDuration, setCustomDuration] = useState("");
  const [barbellOverrides, setBarbellOverrides] = useState<
    Record<string, boolean>
  >({});
  const [barWeights, setBarWeights] = useState<Record<string, number>>({});
  const [tracked, setTracked] = useState<TrackedExercise[]>([]);
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragRect, setDragRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [supersetModalFor, setSupersetModalFor] = useState<string | null>(
    null,
  );
  const [supersetSelection, setSupersetSelection] = useState<Set<string>>(
    new Set(),
  );
  const sessionRef = useRef<SessionData | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevRowTops = useRef<Record<string, number>>({});
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { deltas, lastTimes } = useExerciseHistory(sessionId);
  const restTimer = useRestTimerContext();
  const restTimerEnabled = getRestTimerEnabled();
  const barbellModeEnabled = getBarbellModeEnabled();

  const getExerciseDuration = (sessionExerciseId: string) =>
    exerciseDurations[sessionExerciseId] ?? getRestTimerSeconds();

  const closeDurationPicker = () => {
    setOpenDurationPicker((current) => {
      if (!current) return current;
      setClosingDurationPicker(current);
      setTimeout(() => setClosingDurationPicker(null), 150);
      return null;
    });
  };

  const closeSetTypeMenu = () => {
    setOpenSetTypeMenu((current) => {
      if (!current) return current;
      setClosingSetTypeMenu(current);
      setTimeout(() => setClosingSetTypeMenu(null), 150);
      return null;
    });
  };

  const isBarbellMode = (se: SessionExercise) =>
    barbellModeEnabled &&
    (barbellOverrides[se.id] ?? isLikelyBarbellExercise(se.exercise.name));

  const getBarWeight = (sessionExerciseId: string) =>
    barWeights[sessionExerciseId] ?? getDefaultBarWeight(getWeightUnit());

  const isTracked = (exerciseId: string) =>
    tracked.some((t) => t.exerciseId === exerciseId);

  const fetchTracked = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tracked-exercises`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setTracked(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTracked = async (exerciseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const existing = tracked.find((t) => t.exerciseId === exerciseId);

    try {
      if (existing) {
        setTracked((prev) => prev.filter((t) => t.id !== existing.id));
        await fetch(`${API_URL}/tracked-exercises/${existing.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const res = await fetch(`${API_URL}/tracked-exercises`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ exerciseId }),
        });
        if (res.ok) {
          const data = await res.json();
          setTracked((prev) => [...prev, data]);
        }
      }
    } catch (err) {
      console.error(err);
      fetchTracked();
    }
  };

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

  const fetchSession = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Session introuvable");
      const data = await res.json();
      setSession(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async (muscleGroupName: string) => {
    try {
      const res = await fetch(`${API_URL}/exercises`);
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
      await fetch(`${API_URL}/session-exercises/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
    } catch (err) {
      console.error(err);
      fetchSession();
    }
  };

  const openSupersetModal = (se: SessionExercise) => {
    const group = session?.sessionExercises
      .filter((s) => s.supersetId && s.supersetId === se.supersetId)
      .map((s) => s.id);
    setSupersetSelection(new Set(group ?? []));
    setSupersetModalFor(se.id);
  };

  const confirmSuperset = async () => {
    if (!supersetModalFor) return;
    const selected = Array.from(supersetSelection).filter(
      (id) => id !== supersetModalFor,
    );

    try {
      if (selected.length === 0) {
        await fetch(
          `${API_URL}/session-exercises/${supersetModalFor}/superset`,
          { method: "DELETE" },
        );
      } else {
        await fetch(`${API_URL}/session-exercises/superset`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseIds: [supersetModalFor, ...selected],
          }),
        });
      }
      await fetchSession();
    } catch (err) {
      console.error(err);
    } finally {
      setSupersetModalFor(null);
    }
  };

  // iOS-style reorder animation: capture each row's position before the
  // list re-renders, then invert + animate to the new position so the
  // other rows visibly slide out of the way instead of snapping instantly.
  const captureRowPositions = (skipId: string) => {
    const positions: Record<string, number> = {};
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (el && id !== skipId) positions[id] = el.getBoundingClientRect().top;
    }
    prevRowTops.current = positions;
  };

  const playReorderAnimation = (skipId: string) => {
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (!el || id === skipId) continue;
      const prevTop = prevRowTops.current[id];
      if (prevTop === undefined) continue;
      const newTop = el.getBoundingClientRect().top;
      const delta = prevTop - newTop;
      if (delta === 0) continue;

      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // force reflow before animating
      requestAnimationFrame(() => {
        el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
        const cleanup = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", cleanup);
        };
        el.addEventListener("transitionend", cleanup);
      });
    }
  };

  const handleDragStart = (
    e: React.PointerEvent<HTMLButtonElement>,
    draggedId: string,
  ) => {
    const cardEl = rowRefs.current[draggedId];
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();

    setDraggingId(draggedId);
    setDragRect({ left: rect.left, width: rect.width });
    setDragOffsetY(e.clientY - rect.top);
    setDragCurrentY(e.clientY);

    const handleMove = (e: PointerEvent) => {
      setDragCurrentY(e.clientY);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cardEl = el?.closest<HTMLElement>("[data-se-id]");
      const overId = cardEl?.dataset.seId;
      if (!overId || overId === draggedId) return;

      let didReorder = false;
      setSession((prev) => {
        if (!prev) return prev;
        const list = [...prev.sessionExercises];
        const fromIndex = list.findIndex((s) => s.id === draggedId);
        const toIndex = list.findIndex((s) => s.id === overId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
          return prev;
        }
        captureRowPositions(draggedId);
        didReorder = true;
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);
        return { ...prev, sessionExercises: list };
      });

      if (didReorder) {
        requestAnimationFrame(() => playReorderAnimation(draggedId));
      }
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setDraggingId(null);
      setDragRect(null);
      const order = sessionRef.current?.sessionExercises.map((s) => s.id);
      if (order && order.length > 0) saveExerciseOrder(order);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const addExercise = async (exerciseId: string) => {
    try {
      const res = await fetch(`${API_URL}/session-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, exerciseId }),
      });
      if (!res.ok) throw new Error("Erreur ajout exercice");
      setShowExerciseList(false);
      fetchSession();
    } catch (err) {
      console.error(err);
    }
  };

  const addSet = async (sessionExerciseId: string, sets: SetData[]) => {
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

    try {
      const res = await fetch(`${API_URL}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionExerciseId,
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          unit: lastSet ? lastSet.unit : getWeightUnit(),
        }),
      });
      if (!res.ok) throw new Error("Erreur ajout set");
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

    // Warm-up sets don't count toward personal records.
    if (nextCompleted && set.type !== "warmup" && set.weight > 0) {
      const previousBest = personalRecords[se.exercise.id] ?? 0;
      if (set.weight > previousBest) {
        setPersonalRecords((prev) => ({
          ...prev,
          [se.exercise.id]: set.weight,
        }));
        setPrCelebration({
          exerciseName: se.exercise.name,
          weight: set.weight,
          unit: getWeightUnit(),
        });
      }
    }

    fetch(`${API_URL}/sets/${set.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: nextCompleted }),
    }).catch((err) => {
      console.error(err);
      fetchSession();
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

    try {
      await fetch(`${API_URL}/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchSession();
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      await fetch(`${API_URL}/sets/${setId}`, { method: "DELETE" });
      fetchSession();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-red-400">Session introuvable</p>
      </div>
    );
  }

  const addedIds = session.sessionExercises.map((se) => se.exercise.id);
  const availableExercises = exercises.filter((e) => !addedIds.includes(e.id));

  const popularNames: { [key: string]: string[] } = {
    Chest: [
      "Bench Press",
      "Incline Dumbbell Press",
      "Chest Fly",
      "Push-Up",
      "Cable Crossover",
    ],
    Dos: [
      "Lat Pulldown",
      "Barbell Row",
      "Seated Cable Row",
      "Pull-Up",
      "T-Bar Row",
    ],
    Legs: [
      "Squat",
      "Leg Press",
      "Romanian Deadlift",
      "Leg Extension",
      "Leg Curl",
    ],
    Biceps: [
      "Barbell Curl",
      "Dumbbell Curl",
      "Hammer Curl",
      "Preacher Curl",
      "Cable Curl",
    ],
    Triceps: [
      "Tricep Pushdown",
      "Skull Crusher",
      "Overhead Extension",
      "Dips",
      "Close Grip Bench",
    ],
    Épaules: [
      "Overhead Press",
      "Lateral Raise",
      "Front Raise",
      "Face Pull",
      "Arnold Press",
    ],
    "Avant-bras": ["Wrist Curl", "Reverse Curl", "Farmer Walk", "Dead Hang"],
    Trapèze: ["Shrug", "Face Pull", "Upright Row", "Rack Pull"],
    Abdominaux: ["Crunch", "Plank", "Leg Raise", "Ab Wheel", "Cable Crunch"],
  };

  const groupPopular = popularNames[session.muscleGroup] || [];
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

  const formattedDate = new Date(session.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-8">
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center active:bg-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight">
              {session.muscleGroup}
            </h1>
            <p className="text-sm text-gray-500">{capitalizedDate}</p>
          </div>
        </div>

        {!readOnly && !isEmpty && (
          <button
            onClick={() => setIsEditMode((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 ${
              isEditMode
                ? "bg-[#c9552c] text-white"
                : "bg-white border border-gray-200 text-gray-700"
            }`}
          >
            {isEditMode ? (
              "Terminé"
            ) : (
              "Modifier"
            )}
          </button>
        )}
      </div>

      <div className="px-5 space-y-4">
        {!readOnly && !isEditMode && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => {
                setShowExerciseList(!showExerciseList);
                setSearchQuery("");
              }}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Plus size={16} className="text-[#c9552c]" />
                Ajouter un exercice
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${
                  showExerciseList ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExerciseList && (
              <div className="border-t border-gray-100">
                <div className="px-3 py-2">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice..."
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c9552c] transition-colors"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto px-3 pb-3 space-y-1">
                  {availableExercises
                    .filter((ex) =>
                      ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          addExercise(ex.id);
                          setSearchQuery("");
                        }}
                        className="w-full text-left hover:bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors"
                      >
                        {ex.name}
                      </button>
                    ))}
                  {availableExercises.filter((ex) =>
                    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  ).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">
                      {availableExercises.length === 0
                        ? `Aucun exercice disponible pour ${session.muscleGroup}`
                        : "Aucun résultat"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isEmpty && (
          <div className="bg-white/60 border border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#c9552c]/10 flex items-center justify-center mb-3">
              <Dumbbell size={20} className="text-[#c9552c]" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              Aucun exercice pour l'instant
            </p>
            <p className="text-xs text-gray-400 text-center">
              Ajoute ton premier exercice pour{"\n"}commencer la séance
            </p>
          </div>
        )}

        {isEditMode && (
          <div className="space-y-2">
            {session.sessionExercises.map((se) => {
              const isDragging = draggingId === se.id;
              return (
                <div
                  key={se.id}
                  data-se-id={se.id}
                  ref={(el) => {
                    rowRefs.current[se.id] = el;
                  }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                    isDragging
                      ? "border-2 border-dashed border-gray-300 bg-gray-100/70"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      handleDragStart(e, se.id);
                    }}
                    style={{ touchAction: "none" }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none ${
                      isDragging ? "invisible" : "bg-gray-100"
                    }`}
                    aria-label="Réordonner l'exercice"
                  >
                    <GripVertical size={18} />
                  </button>
                  <span
                    className={`flex-1 text-sm font-semibold ${
                      isDragging ? "text-transparent" : "text-gray-900"
                    }`}
                  >
                    {se.exercise.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {draggingId && dragRect && (
          <div
            className="fixed z-50 flex items-center gap-3 bg-white border border-[#c9552c]/40 rounded-2xl px-4 py-3.5 shadow-2xl scale-[1.04] pointer-events-none"
            style={{
              top: dragCurrentY - dragOffsetY,
              left: dragRect.left,
              width: dragRect.width,
            }}
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
              <GripVertical size={18} />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">
              {
                session.sessionExercises.find((s) => s.id === draggingId)
                  ?.exercise.name
              }
            </span>
          </div>
        )}

        {!isEditMode &&
          session.sessionExercises.map((se, seIndex) => {
          const barbell = isBarbellMode(se);
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
            <div
              key={se.id}
              ref={(el) => {
                exerciseRefs.current[se.id] = el;
              }}
              className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
                removingId === se.id
                  ? "animate-slide-out-right"
                  : "animate-slide-up"
              } ${supersetColor ? "border-l-4" : ""}`}
              style={{
                ...(removingId === se.id
                  ? undefined
                  : { animationDelay: `${seIndex * 80}ms` }),
                ...(supersetColor ? { borderLeftColor: supersetColor } : {}),
              }}
            >
              <div
                className="relative p-5 pb-6 rounded-t-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #3d2a1e 0%, #2a1c14 50%, #1a1210 100%)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {supersetColor ? (
                      <div className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/10">
                        <Link2
                          size={15}
                          style={{ color: supersetColor }}
                          className="flex-shrink-0"
                        />
                        <span
                          className="text-xs font-extrabold uppercase tracking-wider"
                          style={{ color: supersetColor }}
                        >
                          Superset {supersetPosition + 1}/{supersetGroup.length}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Exercice {seIndex + 1} /{" "}
                        {session.sessionExercises.length}
                      </p>
                    )}
                    <button
                      onClick={() => toggleTracked(se.exercise.id)}
                      aria-label="Suivre en record personnel"
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        isTracked(se.exercise.id)
                          ? "bg-[#c9552c] text-white"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      <Trophy size={17} />
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => openSupersetModal(se)}
                        aria-label="Lier en superset"
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          supersetColor
                            ? "bg-white/10 text-white"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {supersetColor ? (
                          <Unlink size={16} />
                        ) : (
                          <Link2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!readOnly && (
                      <button
                        onClick={() => setConfirmDelete(se.id)}
                        className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 active:text-red-300 transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                    {delta && (
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                          delta.value > 0 ? "bg-[#c9552c]" : "bg-white/15"
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase text-white">
                          {delta.value > 0 ? "↑" : "↓"}{" "}
                          {delta.value > 0 ? "+" : ""}
                          {delta.value} {delta.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-black uppercase text-white leading-tight mb-3">
                  {se.exercise.name}
                </h2>

                {!readOnly && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {barbellModeEnabled && (
                      <button
                        onClick={() =>
                          setBarbellOverrides((prev) => ({
                            ...prev,
                            [se.id]: !isBarbellMode(se),
                          }))
                        }
                        className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors ${
                          barbell
                            ? "bg-[#c9552c] text-white"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        Mode barbell
                      </button>
                    )}

                    {restTimerEnabled && (
                      <button
                        onClick={() =>
                          openDurationPicker === se.id
                            ? closeDurationPicker()
                            : setOpenDurationPicker(se.id)
                        }
                        className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-white/10 text-white/80"
                      >
                        Repos {formatDuration(getExerciseDuration(se.id))}
                      </button>
                    )}
                  </div>
                )}

                {!readOnly &&
                  restTimerEnabled &&
                  (openDurationPicker === se.id ||
                    closingDurationPicker === se.id) && (
                    <div
                      className={`mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 origin-top ${
                        closingDurationPicker === se.id
                          ? "animate-menu-close"
                          : "animate-slide-down"
                      }`}
                    >
                      {REST_DURATION_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setExerciseDurations((prev) => ({
                              ...prev,
                              [se.id]: s,
                            }));
                            closeDurationPicker();
                          }}
                          className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                            getExerciseDuration(se.id) === s
                              ? "bg-[#c9552c]/10 text-[#c9552c] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {formatDuration(s)}
                        </button>
                      ))}
                      <div className="flex gap-2 px-1 pt-1 mt-1 border-t border-gray-100">
                        <input
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(e.target.value)}
                          placeholder="Custom (s)"
                          className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#c9552c]"
                        />
                        <button
                          onClick={() => {
                            const val = Number(customDuration);
                            if (val > 0) {
                              setExerciseDurations((prev) => ({
                                ...prev,
                                [se.id]: val,
                              }));
                              closeDurationPicker();
                              setCustomDuration("");
                            }
                          }}
                          disabled={!customDuration || Number(customDuration) <= 0}
                          className="bg-[#c9552c] disabled:opacity-50 text-white text-sm font-semibold px-3 rounded-lg"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              <div className="p-4">
                {lastTime && (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-100 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Dernière fois
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatLastTime(lastTime)}
                    </span>
                  </div>
                )}

                {!readOnly && barbell && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Barre
                    </p>
                    <div className="flex gap-2">
                      {(BAR_WEIGHTS[getWeightUnit()] || BAR_WEIGHTS.lb).map(
                        (bw) => (
                          <button
                            key={bw}
                            onClick={() =>
                              setBarWeights((prev) => ({
                                ...prev,
                                [se.id]: bw,
                              }))
                            }
                            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${
                              getBarWeight(se.id) === bw
                                ? "bg-[#c9552c] text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {bw} {getWeightUnit()}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {se.sets.map((set, i) => {
                    const perSide = barbell
                      ? Math.max(0, (set.weight - barWeight) / 2)
                      : 0;
                    const { plates, remainder } = barbell
                      ? calculatePlates(perSide, getWeightUnit())
                      : { plates: [], remainder: 0 };

                    return (
                      <div key={set.id}>
                        <div className="flex items-start gap-2 mb-2">
                          <button
                            onClick={() =>
                              openSetTypeMenu === set.id
                                ? closeSetTypeMenu()
                                : setOpenSetTypeMenu(set.id)
                            }
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 mt-1 ${getSetTypeColor(
                              set.type,
                            )}`}
                          >
                            {getSetBadgeLabel(set.type, i)}
                          </button>

                          <div className="grid grid-cols-2 gap-3 flex-1">
                          <div className="bg-gray-100 rounded-2xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              {barbell ? "Poids / côté" : "Poids"}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={
                                  barbell
                                    ? perSide === 0
                                      ? ""
                                      : perSide
                                    : set.weight === 0
                                      ? ""
                                      : set.weight
                                }
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  const num =
                                    val === ""
                                      ? 0
                                      : clamp(
                                          Number(val),
                                          MIN_WEIGHT,
                                          MAX_WEIGHT,
                                        );
                                  const total = barbell
                                    ? barWeight + num * 2
                                    : num;
                                  setSession((prev) => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sessionExercises:
                                        prev.sessionExercises.map((s) => ({
                                          ...s,
                                          sets: s.sets.map((st) =>
                                            st.id === set.id
                                              ? { ...st, weight: total }
                                              : st,
                                          ),
                                        })),
                                    };
                                  });
                                }}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) => {
                                  const raw =
                                    e.target.value === ""
                                      ? 0
                                      : clamp(
                                          Number(e.target.value),
                                          MIN_WEIGHT,
                                          MAX_WEIGHT,
                                        );
                                  const total = barbell
                                    ? barWeight + raw * 2
                                    : raw;
                                  updateSet(set.id, { weight: total });
                                }}
                                disabled={readOnly}
                                className="w-full min-w-0 bg-transparent text-3xl font-black text-gray-900 focus:outline-none"
                              />
                              <span className="text-sm font-bold text-gray-400 flex-shrink-0">
                                {getWeightUnit()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-100 rounded-2xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Reps
                            </p>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={set.reps === 0 ? "" : set.reps}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                );
                                const num =
                                  val === ""
                                    ? 0
                                    : clamp(Number(val), MIN_REPS, MAX_REPS);
                                setSession((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sessionExercises:
                                      prev.sessionExercises.map((s) => ({
                                        ...s,
                                        sets: s.sets.map((st) =>
                                          st.id === set.id
                                            ? { ...st, reps: num }
                                            : st,
                                        ),
                                      })),
                                  };
                                });
                              }}
                              onFocus={(e) => e.target.select()}
                              onBlur={(e) => {
                                const num =
                                  e.target.value === ""
                                    ? 0
                                    : clamp(
                                        Number(e.target.value),
                                        MIN_REPS,
                                        MAX_REPS,
                                      );
                                updateSet(set.id, { reps: num });
                              }}
                              disabled={readOnly}
                              className="w-full min-w-0 bg-transparent text-3xl font-black text-gray-900 focus:outline-none"
                            />
                          </div>
                          </div>
                        </div>

                        {(openSetTypeMenu === set.id ||
                          closingSetTypeMenu === set.id) && (
                          <div
                            className={`mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 grid grid-cols-2 gap-1.5 origin-top ${
                              closingSetTypeMenu === set.id
                                ? "animate-menu-close"
                                : "animate-slide-down"
                            }`}
                          >
                            {SET_TYPE_OPTIONS.map((opt) => {
                              const selected = set.type === opt.value;
                              const accent = getSetTypeAccent(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    updateSet(set.id, { type: opt.value });
                                    closeSetTypeMenu();
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors"
                                  style={{
                                    borderColor: selected
                                      ? accent
                                      : "#e5e7eb",
                                    backgroundColor: selected
                                      ? `${accent}14`
                                      : "#f9fafb",
                                  }}
                                >
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getSetTypeColor(
                                      opt.value,
                                    )}`}
                                  >
                                    {SET_TYPE_LETTERS[opt.value]}
                                  </span>
                                  <span
                                    className="flex-1 text-left text-xs font-semibold truncate"
                                    style={{
                                      color: selected ? accent : "#374151",
                                    }}
                                  >
                                    {opt.label}
                                  </span>
                                  {selected && (
                                    <Check
                                      size={14}
                                      strokeWidth={3}
                                      style={{ color: accent }}
                                      className="flex-shrink-0"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {barbell && perSide > 0 && (
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-xs text-gray-400">
                              {barWeight} {getWeightUnit()} barre + 2 ×{" "}
                              {perSide} {getWeightUnit()}
                            </span>
                            <span className="text-xs font-bold text-[#c9552c]">
                              {set.weight} {getWeightUnit()} total
                            </span>
                          </div>
                        )}

                        {barbell && (plates.length > 0 || remainder > 0) && (
                          <div className="mb-2">
                            <PlateRow
                              plates={plates}
                              remainder={remainder}
                              totalWeight={set.weight}
                              unit={getWeightUnit()}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {!readOnly ? (
                            <button
                              onClick={() => toggleSetCompleted(set, se)}
                              className={`flex-1 py-3.5 rounded-full font-bold uppercase text-sm flex items-center justify-center gap-2 transition-colors ${
                                set.completed
                                  ? "bg-[#3a9e6e] text-white"
                                  : "bg-gray-900 text-white active:bg-gray-800"
                              }`}
                            >
                              <Check size={16} strokeWidth={3} />
                              {set.completed
                                ? `Set ${i + 1} validé`
                                : `Valider le set ${i + 1}`}
                            </button>
                          ) : (
                            <div
                              className={`flex-1 py-3.5 rounded-full font-bold uppercase text-sm flex items-center justify-center gap-2 ${
                                set.completed
                                  ? "bg-[#3a9e6e] text-white"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {set.completed && (
                                <Check size={16} strokeWidth={3} />
                              )}
                              Set {i + 1} {set.completed ? "validé" : ""}
                            </div>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => deleteSet(set.id)}
                              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!readOnly && (
                  <button
                    onClick={() => addSet(se.id, se.sets)}
                    className="mt-3 w-full border border-dashed border-[#c9552c]/40 active:bg-[#c9552c]/5 text-[#c9552c] font-bold uppercase text-sm py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Ajouter un set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isEmpty && suggestions.length > 0 && !readOnly && (
        <div className="px-5 mt-6">
          <p className="text-[15px] font-bold text-gray-900 mb-3">
            Suggestions pour {session.muscleGroup}
          </p>
          <div className="space-y-2">
            {suggestions.map((ex) => {
              const lw = lastWeights.find((w) => w.exerciseId === ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex-1 text-left">
                    <p className="text-base font-semibold text-gray-900">
                      {ex.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {lw
                        ? `Dernière fois : ${lw.weight} ${getWeightUnit()}`
                        : "Poids du corps"}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#c9552c]/40 flex items-center justify-center flex-shrink-0">
                    <Plus size={14} className="text-[#c9552c]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Supprimer cet exercice ?
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              Tous les sets associés seront aussi supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(
                      `${API_URL}/session-exercises/${confirmDelete}`,
                      { method: "DELETE" },
                    );
                    setConfirmDelete(null);
                    setRemovingId(confirmDelete);
                    setTimeout(() => {
                      setRemovingId(null);
                      fetchSession();
                    }, 300);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <p className="text-base font-bold text-gray-900 text-center mb-1">
              Lier en superset
            </p>
            <p className="text-sm text-gray-400 text-center mb-4">
              Choisis les exercices à enchaîner sans repos avec{" "}
              {
                session.sessionExercises.find(
                  (s) => s.id === supersetModalFor,
                )?.exercise.name
              }
              .
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
              {session.sessionExercises
                .filter((s) => s.id !== supersetModalFor)
                .map((s) => {
                  const checked = supersetSelection.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setSupersetSelection((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        })
                      }
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors ${
                        checked
                          ? "border-[#c9552c] bg-[#c9552c]/5"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        {s.exercise.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                          checked
                            ? "bg-[#c9552c] text-white"
                            : "border border-gray-300"
                        }`}
                      >
                        {checked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              {session.sessionExercises.length < 2 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  Ajoute un autre exercice à la séance pour créer un superset.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSupersetModalFor(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSuperset}
                className="flex-1 bg-[#c9552c] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
