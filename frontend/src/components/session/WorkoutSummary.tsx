import { Check, Clock, Layers, TrendingUp, Dumbbell, Trophy } from "lucide-react";

type PR = {
  exerciseName: string;
  weight: number;
  unit: string;
};

type Props = {
  muscleGroups: string[];
  durationMinutes: number;
  totalSets: number;
  totalVolume: number;
  totalExercises: number;
  unit: string;
  prs: PR[];
  onClose: () => void;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
}

export default function WorkoutSummary({
  muscleGroups,
  durationMinutes,
  totalSets,
  totalVolume,
  totalExercises,
  unit,
  prs,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, #3d2a1e 0%, #2a1c14 50%, #1a1210 100%)",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-[#3a9e6e] flex items-center justify-center mx-auto mb-3">
            <Check size={28} strokeWidth={3} className="text-white" />
          </div>
          <p className="text-lg font-black text-white uppercase tracking-wide">
            Séance terminée !
          </p>
          {muscleGroups.length > 0 && (
            <p className="text-sm text-white/60 mt-1">
              {muscleGroups.join(", ")}
            </p>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <Clock size={16} className="text-[#c9552c] mb-1.5" />
              <p className="text-xl font-black text-gray-900">
                {formatDuration(durationMinutes)}
              </p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Durée
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <Layers size={16} className="text-[#c9552c] mb-1.5" />
              <p className="text-xl font-black text-gray-900">{totalSets}</p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Sets
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <TrendingUp size={16} className="text-[#c9552c] mb-1.5" />
              <p className="text-xl font-black text-gray-900">
                {totalVolume.toLocaleString("fr-FR")}{" "}
                <span className="text-sm font-bold">{unit}</span>
              </p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Volume total
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3.5">
              <Dumbbell size={16} className="text-[#c9552c] mb-1.5" />
              <p className="text-xl font-black text-gray-900">
                {totalExercises}
              </p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                Exercices
              </p>
            </div>
          </div>

          {prs.length > 0 && (
            <div className="bg-[#c9552c]/5 border border-[#c9552c]/20 rounded-2xl p-3.5 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={14} className="text-[#c9552c]" />
                <p className="text-xs font-bold uppercase tracking-wide text-[#c9552c]">
                  {prs.length} nouveau{prs.length > 1 ? "x" : ""} record
                  {prs.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-1">
                {prs.map((pr, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 font-medium">
                      {pr.exerciseName}
                    </span>
                    <span className="font-bold text-[#c9552c]">
                      {pr.weight} {pr.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold transition-colors active:bg-gray-800"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
