import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
          {t("session.suggestionsFor", { group: muscleGroup })}
        </p>
        <button
          onClick={() => navigate("/exercises", { state: { group: muscleGroup } })}
          className="text-xs font-bold text-[#c9552c] uppercase tracking-wide"
        >
          {t("session.seeAll")}
        </button>
      </div>
      <div className="space-y-2">
        {suggestions.map((ex) => {
          const lw = lastWeights.find((w) => w.exerciseId === ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => onAdd(ex.id)}
              className="w-full bg-[#ece7dd] rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-all"
            >
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900 uppercase">
                  {ex.name}
                </p>
                <p
                  className={`text-xs font-bold uppercase mt-0.5 ${
                    lw ? "text-[#c9552c]" : "text-gray-500"
                  }`}
                >
                  {lw
                    ? t("session.lastTimeWeight", { weight: lw.weight, unit })
                    : t("session.bodyWeightLabel")}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  lw ? "bg-[#c9552c] text-white" : "bg-white/70 text-[#c9552c]"
                }`}
              >
                <Plus size={16} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
