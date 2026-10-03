import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Trophy, Link2, Unlink, StickyNote, Flame, Crown, MoreVertical } from "lucide-react";
import type { SessionExercise, SetData } from "../../types/session";
import { formatDuration } from "../../utils/units";
import { formatLastTime, type Delta as DeltaType, type LastTime as LastTimeType } from "../../hooks/useExerciseDeltas";
import BarbellSelector from "./BarbellSelector";
import RestTimerPicker from "./RestTimerPicker";
import SetRow from "./SetRow";
import ExerciseInfoModal from "./ExerciseInfoModal";

type Delta = DeltaType | undefined;
type LastTime = LastTimeType | undefined;

type Props = {
  se: SessionExercise;
  seIndex: number;
  totalExercises: number;
  barbell: boolean;
  barWeight: number;
  unit: string;
  readOnly: boolean;
  isPro: boolean;
  barbellModeEnabled: boolean;
  isBarbellExercise: boolean;
  restTimerEnabled: boolean;
  exerciseDuration: number;
  delta: Delta;
  lastTime: LastTime;
  isTracked: boolean;
  note: string;
  supersetColor: string | null;
  supersetPosition: number;
  supersetGroupLength: number;
  isRemoving: boolean;
  animationDelay?: number;
  openDurationPicker: boolean;
  closingDurationPicker: boolean;
  openSetTypeMenuId: string | null;
  closingSetTypeMenuId: string | null;
  cardRef: (el: HTMLDivElement | null) => void;
  onToggleTracked: () => void;
  onOpenNoteModal: () => void;
  onOpenSupersetModal: () => void;
  onRequestDelete: () => void;
  onToggleBarbellOverride: () => void;
  onToggleDurationPicker: () => void;
  onSelectDuration: (seconds: number) => void;
  onSelectBarWeight: (weight: number) => void;
  onToggleSetTypeMenu: (setId: string) => void;
  onSelectSetType: (setId: string, type: string) => void;
  onLocalWeightChange: (setId: string, weight: number) => void;
  onCommitWeight: (setId: string, weight: number) => void;
  onLocalRepsChange: (setId: string, reps: number) => void;
  onCommitReps: (setId: string, reps: number) => void;
  onToggleSetCompleted: (set: SetData) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
  onOpenWarmupModal: () => void;
};

export default function ExerciseCard({
  se,
  seIndex,
  totalExercises,
  barbell,
  barWeight,
  unit,
  readOnly,
  isPro,
  barbellModeEnabled,
  isBarbellExercise,
  restTimerEnabled,
  exerciseDuration,
  delta,
  lastTime,
  isTracked,
  note,
  supersetColor,
  supersetPosition,
  supersetGroupLength,
  isRemoving,
  animationDelay,
  openDurationPicker,
  closingDurationPicker,
  openSetTypeMenuId,
  closingSetTypeMenuId,
  cardRef,
  onToggleTracked,
  onOpenNoteModal,
  onOpenSupersetModal,
  onRequestDelete,
  onToggleBarbellOverride,
  onToggleDurationPicker,
  onSelectDuration,
  onSelectBarWeight,
  onToggleSetTypeMenu,
  onSelectSetType,
  onLocalWeightChange,
  onCommitWeight,
  onLocalRepsChange,
  onCommitReps,
  onToggleSetCompleted,
  onDeleteSet,
  onAddSet,
  onOpenWarmupModal,
}: Props) {
  const { t } = useTranslation();
  const [trophyPopping, setTrophyPopping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  // The highest weight logged for this exercise last time it was done, so
  // each set's input can flag "+X" the moment a heavier weight is entered
  // — based on actual history, not just whatever was in the field before.
  const previousBest = lastTime
    ? Math.max(...lastTime.sets.map((s) => s.weight))
    : 0;

  return (
    <div
      ref={cardRef}
      className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300 ${
        isRemoving ? "animate-slide-out-right" : "animate-slide-up"
      } ${supersetColor ? "border-l-4" : ""}`}
      style={{
        ...(isRemoving ? undefined : { animationDelay: `${animationDelay ?? 0}ms` }),
        ...(supersetColor ? { borderLeftColor: supersetColor } : {}),
      }}
    >
      <div
        className="relative p-5 pb-6 rounded-t-2xl"
        style={{
          background: "#191714",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {supersetColor ? (
              <div className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/10">
                <Link2
                  size={15}
                  style={{ color: supersetColor }}
                  className="flex-shrink-0"
                />
                <span
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: supersetColor }}
                >
                  {t("session.card.supersetLabel", {
                    position: supersetPosition + 1,
                    length: supersetGroupLength,
                  })}
                </span>
              </div>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {t("session.card.exerciseLabel", {
                  index: seIndex + 1,
                  total: totalExercises,
                })}
              </p>
            )}
            <button
              data-tour="session-trophy"
              onClick={() => {
                onToggleTracked();
                setTrophyPopping(true);
              }}
              onAnimationEnd={() => setTrophyPopping(false)}
              aria-label={t("session.card.trackAria")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isTracked
                  ? "bg-[#c9552c] text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              <Trophy
                size={17}
                className={trophyPopping ? "animate-trophy-pop" : ""}
              />
            </button>
            <button
              data-tour="session-more"
              onClick={() => setShowActionsMenu((v) => !v)}
              aria-label={t("session.card.moreAria")}
              className="w-9 h-9 rounded-lg bg-white/10 text-white/40 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <MoreVertical size={17} />
            </button>
            {delta && (
              <div
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full ${
                  delta.value > 0 ? "bg-[#c9552c]" : "bg-white/15"
                }`}
              >
                <span className="text-[11px] font-bold uppercase text-white">
                  {delta.value > 0 ? "↑" : "↓"} {Math.abs(delta.value)}{" "}
                  {delta.unit}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInfo(true)}
            aria-label={t("session.exerciseInfo.aria")}
            className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 active:bg-white/25 transition-colors"
          >
            {/* Lucide's Info icon draws its own circle, which — nested
                inside this already-circular button — read as two
                slightly-misaligned-looking circles. A plain "i" glyph
                avoids that double-circle effect entirely. */}
            <svg width="4" height="14" viewBox="0 0 4 14" fill="white" className="block">
              <circle cx="2" cy="2" r="2" />
              <rect x="0" y="6" width="4" height="8" rx="2" />
            </svg>
          </button>
        </div>

        {showActionsMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActionsMenu(false)}
            />
            <div className="absolute left-5 top-16 z-50 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 animate-scale-in origin-top-left">
              <button
                data-tour="session-note"
                onClick={() => {
                  onOpenNoteModal();
                  setShowActionsMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-800 active:bg-gray-50 transition-colors"
              >
                <StickyNote
                  size={16}
                  className={note ? "text-[#c9552c]" : "text-gray-400"}
                />
                {t("session.tour.note.title")}
              </button>
              {!readOnly && (
                <button
                  data-tour="session-superset"
                  onClick={() => {
                    onOpenSupersetModal();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-800 active:bg-gray-50 transition-colors"
                >
                  {supersetColor ? (
                    <Unlink size={16} style={{ color: supersetColor }} />
                  ) : (
                    <Link2 size={16} className="text-gray-400" />
                  )}
                  <span className="flex-1 text-left">
                    {t("session.tour.superset.title")}
                  </span>
                  {!isPro && !supersetColor && (
                    <Crown size={14} className="text-[#c9552c] flex-shrink-0" />
                  )}
                </button>
              )}
              {!readOnly && (
                <button
                  data-tour="session-delete"
                  onClick={() => {
                    onRequestDelete();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 active:bg-red-50 transition-colors border-t border-gray-100 mt-1 pt-2.5"
                >
                  <Trash2 size={16} />
                  {t("session.tour.delete.title")}
                </button>
              )}
            </div>
          </>
        )}

        <div className="mb-3">
          <h2 className="text-2xl font-black uppercase text-white leading-tight">
            {se.exercise.name}
          </h2>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            {barbellModeEnabled && isBarbellExercise && (
              <button
                data-tour="session-barbell-chip"
                onClick={onToggleBarbellOverride}
                className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors ${
                  barbell
                    ? "bg-[#c9552c] text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {t("session.card.barMode")}
              </button>
            )}

            {restTimerEnabled && isPro && (
              <button
                data-tour="session-rest-chip"
                onClick={onToggleDurationPicker}
                className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-white/10 text-white/80"
              >
                {t("session.card.rest", {
                  duration: formatDuration(exerciseDuration),
                })}
              </button>
            )}
          </div>
        )}

        {!readOnly &&
          restTimerEnabled &&
          isPro &&
          (openDurationPicker || closingDurationPicker) && (
            <RestTimerPicker
              currentDuration={exerciseDuration}
              isClosing={closingDurationPicker}
              onSelect={onSelectDuration}
            />
          )}
      </div>

      <div className="p-4">
        {lastTime && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-100 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t("session.card.lastTime")}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {formatLastTime(lastTime)}
            </span>
          </div>
        )}

        {!readOnly && barbell && (
          <BarbellSelector
            unit={unit}
            currentBarWeight={barWeight}
            onSelect={onSelectBarWeight}
          />
        )}

        {!readOnly && se.sets.length === 0 && (
          <button
            data-tour="session-warmup"
            onClick={onOpenWarmupModal}
            className="mb-3 w-full border border-dashed border-gray-300 active:bg-gray-50 text-gray-500 font-bold uppercase text-sm py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
          >
            {isPro ? <Flame size={14} /> : <Crown size={14} />}{" "}
            {t("session.card.autoWarmup")}
          </button>
        )}

        <div className="space-y-3">
          {se.sets.map((set, i) => (
            <SetRow
              key={set.id}
              set={set}
              index={i}
              barbell={barbell}
              barWeight={barWeight}
              unit={unit}
              readOnly={readOnly}
              previousBest={previousBest}
              isTypeMenuOpen={openSetTypeMenuId === set.id}
              isTypeMenuClosing={closingSetTypeMenuId === set.id}
              onToggleTypeMenu={() => onToggleSetTypeMenu(set.id)}
              onSelectType={(type) => onSelectSetType(set.id, type)}
              onLocalWeightChange={(weight) =>
                onLocalWeightChange(set.id, weight)
              }
              onCommitWeight={(weight) => onCommitWeight(set.id, weight)}
              onLocalRepsChange={(reps) => onLocalRepsChange(set.id, reps)}
              onCommitReps={(reps) => onCommitReps(set.id, reps)}
              onToggleCompleted={() => onToggleSetCompleted(set)}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))}
        </div>

        {!readOnly && (
          <button
            data-tour="session-add-set"
            onClick={onAddSet}
            className="mt-3 w-full border border-dashed border-[#c9552c]/40 active:bg-[#c9552c]/5 text-[#c9552c] font-bold uppercase text-sm py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> {t("session.card.addSet")}
          </button>
        )}
      </div>

      {showInfo && (
        <ExerciseInfoModal
          exerciseId={se.exercise.id}
          name={se.exercise.name}
          image={se.exercise.image}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}
