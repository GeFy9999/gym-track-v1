import { useTranslation } from "react-i18next";
import {
  Check,
  Clock,
  Layers,
  Dumbbell,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { getDateLocale } from "../../i18n";

type PR = {
  exerciseName: string;
  weight: number;
  unit: string;
};

type ExerciseDelta = {
  exerciseName: string;
  delta: number;
  unit: string;
};

type Props = {
  muscleGroups: string[];
  date: string;
  durationMinutes: number;
  totalSets: number;
  totalExercises: number;
  prs: PR[];
  exerciseDeltas: ExerciseDelta[];
  onClose: () => void;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${String(rest).padStart(2, "0")}` : `${hours}h`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString(getDateLocale(), {
      weekday: "long",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

export default function WorkoutSummary({
  muscleGroups,
  date,
  durationMinutes,
  totalSets,
  totalExercises,
  prs,
  exerciseDeltas,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-6 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header sombre ── */}
        <div
          className="px-6 pt-8 pb-6 text-center flex-shrink-0"
          style={{
            background: "#191714",
          }}
        >
          <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute w-[84px] h-[84px] rounded-full bg-[#3a9e6e]/20" />
            <div className="relative w-16 h-16 rounded-full bg-[#3a9e6e] flex items-center justify-center">
              <Check size={28} strokeWidth={3} className="text-white" />
            </div>
          </div>
          <h2 className="text-[22px] font-black text-white uppercase tracking-wide">
            {t("session.summary.title")}
          </h2>
          {muscleGroups.length > 0 && (
            <p className="text-[13px] font-semibold text-white/50 uppercase tracking-widest mt-1">
              {muscleGroups.join(" · ")}
            </p>
          )}
          <div className="inline-block mt-3 px-4 py-1 rounded-full bg-[#3d271a] text-[#f0994a] text-[11px] font-bold uppercase tracking-wider">
            {formatDate(date)}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-5 pt-5 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            {/* Grille 2×2 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#ece7dd] rounded-2xl px-4 py-3.5">
                <Clock
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {formatDuration(durationMinutes)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.duration")}
                </p>
              </div>
              <div className="bg-[#ece7dd] rounded-2xl px-4 py-3.5">
                <Layers
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {totalSets}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.sets")}
                </p>
              </div>
              <div className="bg-[#ece7dd] rounded-2xl px-4 py-3.5">
                <Trophy
                  size={15}
                  strokeWidth={1.8}
                  className={`mb-2 ${prs.length > 0 ? "text-[#c9552c]" : "text-gray-300"}`}
                />
                <p
                  className={`text-[26px] font-black leading-none tracking-tight ${prs.length > 0 ? "text-gray-900" : "text-gray-300"}`}
                >
                  {prs.length}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.recordsBeaten", { count: prs.length })}
                </p>
              </div>
              <div className="bg-[#ece7dd] rounded-2xl px-4 py-3.5">
                <Dumbbell
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {totalExercises}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.exercises")}
                </p>
              </div>
            </div>

            {/* Records battus */}
            {prs.length > 0 && (
              <div className="bg-[#c9552c]/5 border border-[#c9552c]/20 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy size={14} className="text-[#c9552c]" />
                  <p className="text-xs font-bold uppercase tracking-wide text-[#c9552c]">
                    {t("session.summary.newRecords", { count: prs.length })}
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

            {/* Progression vs dernière fois */}
            {exerciseDeltas.length > 0 && (
              <div className="bg-[#ece7dd] rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={18} strokeWidth={2.5} className="text-gray-900" />
                  <p className="text-sm font-black uppercase tracking-wide text-gray-900">
                    {t("session.summary.progressionTitle")}
                  </p>
                </div>
                <div className="space-y-1">
                  {exerciseDeltas.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 font-medium">
                        {d.exerciseName}
                      </span>
                      <span className="font-black text-[#c9552c]">
                        {d.delta > 0 ? "↑" : "↓"} {Math.abs(d.delta)} {d.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton Continuer */}
        <div className="px-5 pt-2 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full text-white py-3.5 rounded-2xl font-bold uppercase tracking-wider text-[15px] transition-colors active:opacity-90"
            style={{ background: "#191714" }}
          >
            {t("session.summary.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
