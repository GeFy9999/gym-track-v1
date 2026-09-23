import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Trophy, Link2, Unlink, StickyNote, Flame, Crown } from "lucide-react";
import type { SessionExercise, SetData } from "../../types/session";
import { formatDuration } from "../../utils/units";
import { formatLastTime, type Delta as DeltaType, type LastTime as LastTimeType } from "../../hooks/useExerciseDeltas";
import BarbellSelector from "./BarbellSelector";
import RestTimerPicker from "./RestTimerPicker";
import SetRow from "./SetRow";

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
              data-tour="session-note"
              onClick={onOpenNoteModal}
              aria-label={t("session.card.noteAria")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                note ? "bg-[#c9552c] text-white" : "bg-white/10 text-white/40"
              }`}
            >
              <StickyNote size={17} />
            </button>
            {!readOnly && (
              <button
                data-tour="session-superset"
                onClick={onOpenSupersetModal}
                aria-label={t("session.card.supersetAria")}
                className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  !supersetColor ? "bg-white/10 text-white/40" : ""
                }`}
                style={
                  supersetColor
                    ? { backgroundColor: `${supersetColor}26`, color: supersetColor }
                    : undefined
                }
              >
                {supersetColor ? <Unlink size={16} /> : <Link2 size={16} />}
                {!isPro && !supersetColor && (
                  <Crown
                    size={14}
                    className="absolute -top-1.5 -right-1.5 text-[#c9552c] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  />
                )}
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!readOnly && (
              <button
                data-tour="session-delete"
                onClick={onRequestDelete}
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 active:text-red-300 transition-colors"
              >
                <Trash2 size={17} />
              </button>
            )}
            {delta && (
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                  delta.value > 0 ? "bg-[#c9552c]" : "bg-white/15"
                }`}
              >
                <span className="text-[11px] font-bold uppercase text-white">
                  {delta.value > 0 ? "↑" : "↓"} {delta.value > 0 ? "+" : ""}
                  {delta.value} {delta.unit}
                </span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-black uppercase text-white leading-tight mb-3">
          {se.exercise.name}
        </h2>

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
    </div>
  );
}
