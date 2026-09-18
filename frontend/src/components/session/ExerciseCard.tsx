import { Plus, Trash2, Trophy, Link2, Unlink, StickyNote } from "lucide-react";
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
  barbellModeEnabled: boolean;
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
};

export default function ExerciseCard({
  se,
  seIndex,
  totalExercises,
  barbell,
  barWeight,
  unit,
  readOnly,
  barbellModeEnabled,
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
}: Props) {
  return (
    <div
      ref={cardRef}
      className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
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
          background:
            "linear-gradient(135deg, #3d2a1e 0%, #2a1c14 50%, #1a1210 100%)",
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
                  Superset {supersetPosition + 1}/{supersetGroupLength}
                </span>
              </div>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Exercice {seIndex + 1} / {totalExercises}
              </p>
            )}
            <button
              onClick={onToggleTracked}
              aria-label="Suivre en record personnel"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isTracked
                  ? "bg-[#c9552c] text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              <Trophy size={17} />
            </button>
            <button
              onClick={onOpenNoteModal}
              aria-label="Note personnelle"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                note ? "bg-[#c9552c] text-white" : "bg-white/10 text-white/40"
              }`}
            >
              <StickyNote size={17} />
            </button>
            {!readOnly && (
              <button
                onClick={onOpenSupersetModal}
                aria-label="Lier en superset"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  supersetColor
                    ? "bg-white/10 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {supersetColor ? <Unlink size={16} /> : <Link2 size={16} />}
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {!readOnly && (
              <button
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
            {barbellModeEnabled && (
              <button
                onClick={onToggleBarbellOverride}
                className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors ${
                  barbell
                    ? "bg-[#c9552c] text-white"
                    : "bg-white/10 text-white/60"
                }`}
              >
                Mode barbell
              </button>
            )}

            {restTimerEnabled && (
              <button
                onClick={onToggleDurationPicker}
                className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-white/10 text-white/80"
              >
                Repos {formatDuration(exerciseDuration)}
              </button>
            )}
          </div>
        )}

        {!readOnly &&
          restTimerEnabled &&
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
              Dernière fois
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
            onClick={onAddSet}
            className="mt-3 w-full border border-dashed border-[#c9552c]/40 active:bg-[#c9552c]/5 text-[#c9552c] font-bold uppercase text-sm py-3 rounded-full flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Ajouter un set
          </button>
        )}
      </div>
    </div>
  );
}
