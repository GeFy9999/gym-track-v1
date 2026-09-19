import { Check, X } from "lucide-react";
import type { SetData } from "../../types/session";
import {
  calculatePlates,
  MIN_WEIGHT,
  MAX_WEIGHT,
  MIN_REPS,
  MAX_REPS,
} from "../../utils/plates";
import { getSetTypeColor, getSetBadgeLabel } from "../../utils/setTypes";
import PlateRow from "./PlateRow";
import SetTypeMenu from "./SetTypeMenu";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

type Props = {
  set: SetData;
  index: number;
  barbell: boolean;
  barWeight: number;
  unit: string;
  readOnly: boolean;
  isTypeMenuOpen: boolean;
  isTypeMenuClosing: boolean;
  onToggleTypeMenu: () => void;
  onSelectType: (type: string) => void;
  onLocalWeightChange: (weight: number) => void;
  onCommitWeight: (weight: number) => void;
  onLocalRepsChange: (reps: number) => void;
  onCommitReps: (reps: number) => void;
  onToggleCompleted: () => void;
  onDelete: () => void;
};

export default function SetRow({
  set,
  index,
  barbell,
  barWeight,
  unit,
  readOnly,
  isTypeMenuOpen,
  isTypeMenuClosing,
  onToggleTypeMenu,
  onSelectType,
  onLocalWeightChange,
  onCommitWeight,
  onLocalRepsChange,
  onCommitReps,
  onToggleCompleted,
  onDelete,
}: Props) {
  const perSide = barbell ? Math.max(0, (set.weight - barWeight) / 2) : 0;
  const { plates, remainder } = barbell
    ? calculatePlates(perSide, unit)
    : { plates: [], remainder: 0 };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          data-tour="session-set-type"
          onClick={onToggleTypeMenu}
          className={`w-11 h-11 self-center rounded-lg flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${getSetTypeColor(
            set.type,
          )}`}
        >
          {getSetBadgeLabel(set.type, index)}
        </button>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <div data-tour="session-set-weight" className="bg-gray-100 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              {barbell ? "Poids / côté" : "Poids"}
            </p>
            <div className="flex items-baseline gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  barbell
                    ? perSide === 0
                      ? ""
                      : perSide
                    : set.weight === 0
                      ? ""
                      : set.weight
                }
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  const num =
                    val === "" ? 0 : clamp(Number(val), MIN_WEIGHT, MAX_WEIGHT);
                  const total = barbell ? barWeight + num * 2 : num;
                  onLocalWeightChange(total);
                }}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  const raw =
                    e.target.value === ""
                      ? 0
                      : clamp(Number(e.target.value), MIN_WEIGHT, MAX_WEIGHT);
                  const total = barbell ? barWeight + raw * 2 : raw;
                  onCommitWeight(total);
                }}
                disabled={readOnly}
                className="w-full min-w-0 bg-transparent text-3xl font-black text-gray-900 focus:outline-none"
              />
              <span className="text-sm font-bold text-gray-400 flex-shrink-0">
                {unit}
              </span>
            </div>
          </div>

          <div data-tour="session-set-reps" className="bg-gray-100 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Reps
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={set.reps === 0 ? "" : set.reps}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                const num =
                  val === "" ? 0 : clamp(Number(val), MIN_REPS, MAX_REPS);
                onLocalRepsChange(num);
              }}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => {
                const num =
                  e.target.value === ""
                    ? 0
                    : clamp(Number(e.target.value), MIN_REPS, MAX_REPS);
                onCommitReps(num);
              }}
              disabled={readOnly}
              className="w-full min-w-0 bg-transparent text-3xl font-black text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-1.5 w-11 flex-shrink-0">
            <button
              data-tour="session-set-check"
              onClick={onToggleCompleted}
              className={`flex-1 rounded-lg flex items-center justify-center transition-colors ${
                set.completed
                  ? "bg-[#3a9e6e] text-white"
                  : "bg-gray-900 text-white active:bg-gray-800"
              }`}
            >
              <Check size={16} strokeWidth={3} />
            </button>
            <button
              data-tour="session-set-delete"
              onClick={onDelete}
              className="flex-1 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 active:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {(isTypeMenuOpen || isTypeMenuClosing) && (
        <SetTypeMenu
          currentType={set.type}
          isClosing={isTypeMenuClosing}
          onSelect={onSelectType}
        />
      )}

      {barbell && (plates.length > 0 || remainder > 0) && (
        <div className="mb-2">
          <PlateRow
            plates={plates}
            remainder={remainder}
            totalWeight={set.weight}
            unit={unit}
          />
        </div>
      )}
    </div>
  );
}
