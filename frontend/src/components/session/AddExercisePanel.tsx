import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = availableExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <button
        data-tour="session-add-exercise"
        onClick={() => {
          setShowExerciseList(!showExerciseList);
          setSearchQuery("");
        }}
        className="w-full bg-[#c9552c] rounded-full px-5 py-3.5 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
          <Plus size={16} />
          {t("session.addExercise")}
        </span>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            showExerciseList ? "rotate-180" : ""
          }`}
        />
      </button>

      {showExerciseList && (
        <div className="bg-[#ece7dd] rounded-2xl mt-2 shadow-sm overflow-hidden">
          <div className="px-3 py-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("session.searchExercisePlaceholder")}
                autoFocus
                className="w-full bg-white/60 rounded-full pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none transition-colors"
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
                className="w-full text-left hover:bg-white/40 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors"
              >
                {ex.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-3">
                {availableExercises.length === 0
                  ? t("session.noExerciseForGroup", { group: muscleGroup })
                  : t("session.noResults")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
