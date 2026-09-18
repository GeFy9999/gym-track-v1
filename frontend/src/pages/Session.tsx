import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import {
  getWeightUnit,
  getRestTimerSeconds,
  getRestTimerEnabled,
  getBarbellModeEnabled,
} from "../utils/units";
import { API_URL } from "../lib/api";
import { useExerciseHistory } from "../hooks/useExerciseDeltas";
import { useRestTimerContext } from "../contexts/RestTimerContext";
import { useTrackedExercises } from "../hooks/useTrackedExercises";
import { useExerciseNotes } from "../hooks/useExerciseNotes";
import { useSupersetManager } from "../hooks/useSupersetManager";
import { isLikelyBarbellExercise, getDefaultBarWeight } from "../utils/plates";
import PRCelebration from "../components/session/PRCelebration";
import ExerciseReorderList from "../components/session/ExerciseReorderList";
import ExerciseCard from "../components/session/ExerciseCard";
import AddExercisePanel from "../components/session/AddExercisePanel";
import ExerciseSuggestions from "../components/session/ExerciseSuggestions";
import SupersetModal from "../components/session/SupersetModal";
import NoteModal from "../components/session/NoteModal";
import DeleteExerciseModal from "../components/session/DeleteExerciseModal";
import { POPULAR_EXERCISES_BY_MUSCLE_GROUP } from "../utils/popularExercises";
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
  const [openDurationPicker, setOpenDurationPicker] = useState<string | null>(
    null,
  );
  const [closingDurationPicker, setClosingDurationPicker] = useState<
    string | null
  >(null);
  const [barbellOverrides, setBarbellOverrides] = useState<
    Record<string, boolean>
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
  const sessionRef = useRef<SessionData | null>(null);
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { deltas, lastTimes } = useExerciseHistory(sessionId);
  const restTimer = useRestTimerContext();
  const restTimerEnabled = getRestTimerEnabled();
  const barbellModeEnabled = getBarbellModeEnabled();

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

  const {
    supersetModalFor,
    supersetSelection,
    openSupersetModal,
    closeSupersetModal,
    toggleSupersetSelection,
    confirmSuperset,
  } = useSupersetManager(session, fetchSession);

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
    fetchExerciseNotes();
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

  const addExercise = async (exerciseId: string) => {
    try {
      const res = await fetch(`${API_URL}/session-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const formattedDate = new Date(session.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const unit = getWeightUnit();

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
            {isEditMode ? "Terminé" : "Modifier"}
          </button>
        )}
      </div>

      <div className="px-5 space-y-4">
        {!readOnly && !isEditMode && (
          <AddExercisePanel
            muscleGroup={session.muscleGroup}
            availableExercises={availableExercises}
            onAdd={addExercise}
          />
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
              <ExerciseCard
                key={se.id}
                se={se}
                seIndex={seIndex}
                totalExercises={session.sessionExercises.length}
                barbell={barbell}
                barWeight={barWeight}
                unit={unit}
                readOnly={readOnly}
                barbellModeEnabled={barbellModeEnabled}
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
                openDurationPicker={openDurationPicker === se.id}
                closingDurationPicker={closingDurationPicker === se.id}
                openSetTypeMenuId={openSetTypeMenu}
                closingSetTypeMenuId={closingSetTypeMenu}
                cardRef={(el) => {
                  exerciseRefs.current[se.id] = el;
                }}
                onToggleTracked={() => toggleTracked(se.exercise.id)}
                onOpenNoteModal={() => openNoteModal(se.exercise.id)}
                onOpenSupersetModal={() => openSupersetModal(se)}
                onRequestDelete={() => setConfirmDelete(se.id)}
                onToggleBarbellOverride={() =>
                  setBarbellOverrides((prev) => ({
                    ...prev,
                    [se.id]: !isBarbellMode(se),
                  }))
                }
                onToggleDurationPicker={() =>
                  openDurationPicker === se.id
                    ? closeDurationPicker()
                    : setOpenDurationPicker(se.id)
                }
                onSelectDuration={(seconds) => {
                  setExerciseDurations((prev) => ({
                    ...prev,
                    [se.id]: seconds,
                  }));
                  closeDurationPicker();
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
              />
            );
          })}
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
              await fetch(`${API_URL}/session-exercises/${confirmDelete}`, {
                method: "DELETE",
              });
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
    </div>
  );
}
