import { useState } from "react";
import { Plus, ChevronDown, Search } from "lucide-react";
import type { AvailableExercise } from "../../types/session";

type Props = {
  muscleGroup: string;
  availableExercises: AvailableExercise[];
  onAdd: (exerciseId: string) => void;
};

export default function AddExercisePanel({
  muscleGroup,
  availableExercises,
  onAdd,
}: Props) {
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = availableExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        data-tour="session-add-exercise"
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
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  onAdd(ex.id);
                  setSearchQuery("");
                }}
                className="w-full text-left hover:bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors"
              >
                {ex.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">
                {availableExercises.length === 0
                  ? `Aucun exercice disponible pour ${muscleGroup}`
                  : "Aucun résultat"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
