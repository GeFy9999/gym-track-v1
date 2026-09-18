import { Check } from "lucide-react";
import type { SessionExercise } from "../../types/session";

type Props = {
  exercises: SessionExercise[];
  supersetModalFor: string;
  supersetSelection: Set<string>;
  onToggleSelection: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SupersetModal({
  exercises,
  supersetModalFor,
  supersetSelection,
  onToggleSelection,
  onClose,
  onConfirm,
}: Props) {
  const target = exercises.find((s) => s.id === supersetModalFor);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <p className="text-base font-bold text-gray-900 text-center mb-1">
          Lier en superset
        </p>
        <p className="text-sm text-gray-400 text-center mb-4">
          Choisis les exercices à enchaîner sans repos avec{" "}
          {target?.exercise.name}.
        </p>

        <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
          {exercises
            .filter((s) => s.id !== supersetModalFor)
            .map((s) => {
              const checked = supersetSelection.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggleSelection(s.id)}
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
          {exercises.length < 2 && (
            <p className="text-xs text-gray-400 text-center py-3">
              Ajoute un autre exercice à la séance pour créer un superset.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#c9552c] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
