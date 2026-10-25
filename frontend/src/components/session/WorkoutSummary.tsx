import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { getMuscleGroupLabel } from "../../utils/muscleGroupLabel";
import { formatWorkoutDuration } from "../../utils/units";

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

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts from 0 up to `target` (ease-out) once `delayMs` has passed, so the
// stat tiles' numbers roll up as they appear. Straight to the value when
// the user asked for reduced motion.
function useCountUp(target: number, delayMs: number, durationMs = 900) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion() || target <= 0) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const timeout = window.setTimeout(() => {
      const step = (now: number) => {
        start ??= now;
        const progress = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [target, delayMs, durationMs]);

  return value;
}

// Confetti burst from the check mark: pieces fly out in every direction.
const BURST_COLORS = ["#3a9e6e", "#c9552c", "#f0994a", "#ffffff", "#e2703a"];
const BURST_PIECES = 16;

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
  const reduceMotion = useMemo(prefersReducedMotion, []);

  // The entrance plays as one sequence: card, check, header lines, stat
  // tiles (numbers rolling up), records / progression, then the button.
  const enter = (delayMs: number): { className: string; style?: CSSProperties } =>
    reduceMotion
      ? { className: "" }
      : {
          className: "animate-soft-fade-in",
          style: { animationDelay: `${delayMs}ms` },
        };
  const TILES_AT = 420;
  const TILE_STEP = 80;

  const durationCount = useCountUp(durationMinutes, TILES_AT);
  const setsCount = useCountUp(totalSets, TILES_AT + TILE_STEP);
  const prsCount = useCountUp(prs.length, TILES_AT + 2 * TILE_STEP);
  const exercisesCount = useCountUp(totalExercises, TILES_AT + 3 * TILE_STEP);

  const burst = useMemo(
    () =>
      Array.from({ length: BURST_PIECES }, (_, i) => {
        const angle = (i / BURST_PIECES) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 70 + Math.random() * 50;
        return {
          id: i,
          color: BURST_COLORS[i % BURST_COLORS.length],
          size: 5 + Math.round(Math.random() * 4),
          round: i % 3 === 0,
          style: {
            "--dx": `${Math.cos(angle) * distance}px`,
            "--dy": `${Math.sin(angle) * distance}px`,
            "--rot": `${Math.round(Math.random() * 540 - 270)}deg`,
            animationDelay: `${250 + Math.random() * 120}ms`,
          } as CSSProperties,
        };
      }),
    [],
  );

  const tile = (index: number) => enter(TILES_AT + index * TILE_STEP);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center-safe justify-center overflow-y-auto py-6 z-[60] px-6 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-summary-card-in overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Header sombre ── */}
        <div
          className="px-6 pt-8 pb-6 text-center flex-shrink-0"
          style={{
            background: "#191714",
          }}
        >
          <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute w-[84px] h-[84px] rounded-full bg-[#3a9e6e]/20" />
            <div className="absolute w-[84px] h-[84px] rounded-full border-2 border-[#3a9e6e] opacity-0 animate-summary-halo" />
            {burst.map((piece) => (
              <span
                key={piece.id}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 animate-summary-burst"
                style={{
                  ...piece.style,
                  width: piece.size,
                  height: piece.size,
                  marginLeft: -piece.size / 2,
                  marginTop: -piece.size / 2,
                  background: piece.color,
                  borderRadius: piece.round ? "9999px" : "2px",
                }}
              />
            ))}
            <div
              className={`relative w-16 h-16 rounded-full bg-[#3a9e6e] flex items-center justify-center ${
                reduceMotion ? "" : "animate-pop-in"
              }`}
              style={reduceMotion ? undefined : { animationDelay: "150ms" }}
            >
              <Check size={28} strokeWidth={3} className="text-white" />
            </div>
          </div>
          <h2
            className={`text-[22px] font-black text-white uppercase tracking-wide ${enter(250).className}`}
            style={enter(250).style}
          >
            {t("session.summary.title")}
          </h2>
          {muscleGroups.length > 0 && (
            <p
              className={`text-[13px] font-semibold text-white/50 uppercase tracking-widest mt-1 ${enter(310).className}`}
              style={enter(310).style}
            >
              {muscleGroups.map((g) => getMuscleGroupLabel(g, t)).join(" · ")}
            </p>
          )}
          <div
            className={`inline-block mt-3 px-4 py-1 rounded-full bg-[#3d271a] text-[#f0994a] text-[11px] font-bold uppercase tracking-wider ${enter(370).className}`}
            style={enter(370).style}
          >
            {formatDate(date)}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-5 pt-5 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-4">
            {/* Grille 2×2 */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={`bg-[#ece7dd] rounded-2xl px-4 py-3.5 ${tile(0).className}`}
                style={tile(0).style}
              >
                <Clock
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {formatWorkoutDuration(durationCount)}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.duration")}
                </p>
              </div>
              <div
                className={`bg-[#ece7dd] rounded-2xl px-4 py-3.5 ${tile(1).className}`}
                style={tile(1).style}
              >
                <Layers
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {setsCount}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.sets")}
                </p>
              </div>
              <div
                className={`bg-[#ece7dd] rounded-2xl px-4 py-3.5 ${tile(2).className}`}
                style={tile(2).style}
              >
                <Trophy
                  size={15}
                  strokeWidth={1.8}
                  className={`mb-2 ${prs.length > 0 ? "text-[#c9552c]" : "text-gray-300"}`}
                />
                <p
                  className={`text-[26px] font-black leading-none tracking-tight ${prs.length > 0 ? "text-gray-900" : "text-gray-300"}`}
                >
                  {prsCount}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.recordsBeaten", { count: prs.length })}
                </p>
              </div>
              <div
                className={`bg-[#ece7dd] rounded-2xl px-4 py-3.5 ${tile(3).className}`}
                style={tile(3).style}
              >
                <Dumbbell
                  size={15}
                  strokeWidth={1.8}
                  className="text-[#c9552c] mb-2"
                />
                <p className="text-[26px] font-black text-gray-900 leading-none tracking-tight">
                  {exercisesCount}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  {t("session.summary.exercises")}
                </p>
              </div>
            </div>

            {/* Records battus */}
            {prs.length > 0 && (
              <div
                className={`bg-[#c9552c]/5 border border-[#c9552c]/20 rounded-2xl p-3.5 ${enter(TILES_AT + 4 * TILE_STEP + 60).className}`}
                style={enter(TILES_AT + 4 * TILE_STEP + 60).style}
              >
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
              <div
                className={`bg-[#ece7dd] rounded-2xl p-3.5 ${enter(TILES_AT + 4 * TILE_STEP + 140).className}`}
                style={enter(TILES_AT + 4 * TILE_STEP + 140).style}
              >
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
        <div
          className={`px-5 pt-2 pb-6 flex-shrink-0 ${enter(TILES_AT + 4 * TILE_STEP + 220).className}`}
          style={enter(TILES_AT + 4 * TILE_STEP + 220).style}
        >
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
