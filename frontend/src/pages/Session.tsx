import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ChevronDown, Search } from "lucide-react";
import { getWeightUnit } from "../utils/units";

const API_URL = "/api";

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

  useEffect(() => {
    fetchSession();
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
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-red-400">Session introuvable</p>
      </div>
    );
  }

  const addedIds = session.sessionExercises.map((se) => se.exercise.id);
  const availableExercises = exercises.filter((e) => !addedIds.includes(e.id));

  return (
    <div className="min-h-screen bg-zinc-900 pb-8">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            {session.muscleGroup}
          </h1>
          <p className="text-xs text-zinc-500">
            {new Date(session.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {session.sessionExercises.map((se) => (
          <div
            key={se.id}
            className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
          >
            <div className="relative">
              {se.exercise.image ? (
                <img
                  src={se.exercise.image}
                  alt={se.exercise.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-zinc-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-3 left-4 text-lg font-bold text-white">
                {se.exercise.name}
              </p>
              {!readOnly && (
                <button
                  onClick={() => setConfirmDelete(se.id)}
                  className="absolute top-3 right-3 bg-zinc-900/60 p-2 rounded-lg text-zinc-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="p-4">
              {se.sets.length > 0 && (
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="w-6" />
                  <span className="w-24 text-xs text-zinc-500 uppercase tracking-wide text-center">
                    Poids
                  </span>
                  <span className="w-4" />
                  <span className="w-20 text-xs text-zinc-500 uppercase tracking-wide text-center">
                    Reps
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {se.sets.map((set, i) => (
                  <div key={set.id} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500 w-6 text-center font-medium">
                      {i + 1}
                    </span>
                    <input
                      type="number"
                      defaultValue={set.weight}
                      onBlur={(e) =>
                        updateSet(set.id, { weight: Number(e.target.value) })
                      }
                      disabled={readOnly}
                      className={`w-24 border rounded-xl px-3 py-2.5 text-base text-white text-center font-semibold focus:outline-none transition-colors ${
                        readOnly
                          ? "bg-zinc-800 border-zinc-700"
                          : "bg-zinc-700 border-zinc-600 focus:border-orange-500"
                      }`}
                    />
                    <span className="text-sm text-zinc-500">×</span>
                    <input
                      type="number"
                      defaultValue={set.reps}
                      onBlur={(e) =>
                        updateSet(set.id, { reps: Number(e.target.value) })
                      }
                      disabled={readOnly}
                      className={`w-20 border rounded-xl px-3 py-2.5 text-base text-white text-center font-semibold focus:outline-none transition-colors ${
                        readOnly
                          ? "bg-zinc-800 border-zinc-700"
                          : "bg-zinc-700 border-zinc-600 focus:border-orange-500"
                      }`}
                    />
                    <span className="text-xs text-zinc-500">reps</span>
                    {!readOnly && (
                      <button
                        onClick={() => deleteSet(set.id)}
                        className="ml-auto text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <button
                  onClick={() => addSet(se.id, se.sets)}
                  className="mt-4 text-sm text-orange-400 font-semibold flex items-center gap-1.5 hover:text-orange-300"
                >
                  <Plus size={16} /> Ajouter un set
                </button>
              )}
            </div>
          </div>
        ))}

        {!readOnly && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setShowExerciseList(!showExerciseList);
                setSearchQuery("");
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-750 transition-colors"
            >
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus size={16} className="text-orange-400" />
                Ajouter un exercice
              </span>
              <ChevronDown
                size={18}
                className={`text-zinc-400 transition-transform duration-200 ${
                  showExerciseList ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExerciseList && (
              <div className="border-t border-zinc-700">
                <div className="px-3 py-2">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un exercice..."
                      autoFocus
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
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
                        className="w-full text-left bg-zinc-700/50 hover:bg-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition-colors flex items-center gap-3"
                      >
                        {ex.image && (
                          <img
                            src={ex.image}
                            alt={ex.name}
                            className="w-14 h-14 rounded-lg object-cover bg-zinc-600 flex-shrink-0"
                          />
                        )}
                        <span className="text-sm">{ex.name}</span>
                      </button>
                    ))}
                  {availableExercises.filter((ex) =>
                    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  ).length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-3">
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
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-white text-center mb-2">
              Supprimer cet exercice ?
            </p>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Tous les sets associés seront aussi supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-semibold transition-colors"
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
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
