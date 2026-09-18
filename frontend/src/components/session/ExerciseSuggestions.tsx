import { Plus } from "lucide-react";
import type { AvailableExercise, LastWeight } from "../../types/session";

type Props = {
  muscleGroup: string;
  suggestions: AvailableExercise[];
  lastWeights: LastWeight[];
  unit: string;
  onAdd: (exerciseId: string) => void;
};

export default function ExerciseSuggestions({
  muscleGroup,
  suggestions,
  lastWeights,
  unit,
  onAdd,
}: Props) {
  return (
    <div className="px-5 mt-6">
      <p className="text-[15px] font-bold text-gray-900 mb-3">
        Suggestions pour {muscleGroup}
      </p>
      <div className="space-y-2">
        {suggestions.map((ex) => {
          const lw = lastWeights.find((w) => w.exerciseId === ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => onAdd(ex.id)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-all"
            >
              <div className="flex-1 text-left">
                <p className="text-base font-semibold text-gray-900">
                  {ex.name}
                </p>
                <p className="text-sm text-gray-400">
                  {lw
                    ? `Dernière fois : ${lw.weight} ${unit}`
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
  );
}
