import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  Search,
  Dumbbell,
} from "lucide-react";
import { getWeightUnit } from "../utils/units";
import { API_URL } from "../lib/api";

type SetData = {
  id: string;
  weight: number;
  reps: number;
  unit: string;
};

type SessionExercise = {
  id: string;
  exercise: { id: string; name: string; image: string | null };
  sets: SetData[];
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
  const [loading, setLoading] = useState(true);
  const [lastWeights, setLastWeights] = useState<LastWeight[]>([]);

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
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      fetchExercises(session.muscleGroup);
    }
  }, [session?.muscleGroup]);

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

  const updateSet = async (
    setId: string,
    data: { weight?: number; reps?: number },
  ) => {
    try {
      await fetch(`${API_URL}/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

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
    } catch (err) {
      console.error(err);
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
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
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

      <div className="px-5 space-y-4">
        {!readOnly && (
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

        {session.sessionExercises.map((se) => (
          <div
            key={se.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div
              className="relative h-24 rounded-t-2xl flex items-end"
              style={{
                background:
                  "linear-gradient(135deg, #3d2a1e 0%, #2a1c14 50%, #1a1210 100%)",
              }}
            >
              <p className="absolute bottom-3 left-4 text-lg font-bold text-white">
                {se.exercise.name}
              </p>
              {!readOnly && (
                <button
                  onClick={() => setConfirmDelete(se.id)}
                  className="absolute top-3 right-3 bg-white/20 p-2 rounded-xl text-white active:text-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="p-4">
              {se.sets.length > 0 && (
                <div className="grid grid-cols-[28px_1fr_1fr_32px] items-center mb-3">
                  <span />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Poids ({getWeightUnit()})
                  </span>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Reps
                  </span>
                  <span />
                </div>
              )}

              <div className="space-y-2.5">
                {se.sets.map((set, i) => (
                  <div
                    key={set.id}
                    className="grid grid-cols-[28px_1fr_1fr_32px] items-center gap-2"
                  >
                    <span className="text-sm text-[#c9552c] text-center font-semibold">
                      {i + 1}
                    </span>
                    <input
                      type="number"
                      defaultValue={set.weight}
                      onBlur={(e) =>
                        updateSet(set.id, { weight: Number(e.target.value) })
                      }
                      disabled={readOnly}
                      className="w-full rounded-xl px-3 py-3 text-base text-gray-900 text-center font-bold bg-gray-100 focus:bg-gray-200 focus:outline-none transition-colors"
                    />
                    <input
                      type="number"
                      defaultValue={set.reps}
                      onBlur={(e) =>
                        updateSet(set.id, { reps: Number(e.target.value) })
                      }
                      disabled={readOnly}
                      className="w-full rounded-xl px-3 py-3 text-base text-gray-900 text-center font-bold bg-gray-100 focus:bg-gray-200 focus:outline-none transition-colors"
                    />
                    {!readOnly ? (
                      <button
                        onClick={() => deleteSet(set.id)}
                        className="text-gray-300 active:text-red-500 transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <button
                  onClick={() => addSet(se.id, se.sets)}
                  className="mt-4 text-sm text-[#c9552c] font-semibold flex items-center gap-1.5"
                >
                  <Plus size={16} /> Ajouter un set
                </button>
              )}
            </div>
          </div>
        ))}
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
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
                    fetchSession();
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
    </div>
  );
}
