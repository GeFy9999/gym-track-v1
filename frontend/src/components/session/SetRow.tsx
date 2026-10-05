import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import type { LoadingType } from "../../utils/loadingType";
import { playSetCompleteSound } from "../../utils/sound";
import PlateRow from "./PlateRow";
import SetTypeMenu from "./SetTypeMenu";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const round1 = (n: number) => Math.round(n * 10) / 10;

const WEIGHT_LABEL_KEYS: Record<LoadingType, string> = {
  BARBELL: "session.weightTotal",
  PLATE_LOADED: "session.weightPerSide",
  DUMBBELL: "session.weightPerDumbbell",
  MACHINE: "session.weightStack",
  CABLE: "session.weightStack",
  BODYWEIGHT: "session.addedWeight",
  ASSISTED: "session.assistance",
};

type Props = {
  set: SetData;
  index: number;
  // null = plain "Weight" input (loading types off / free plan).
  loadingType: LoadingType | null;
  barWeight: number;
  unit: string;
  readOnly: boolean;
  previousBest: number;
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
  loadingType,
  barWeight,
  unit,
  readOnly,
  previousBest,
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
  const { t } = useTranslation();
  // set.weight always stores the TOTAL load. A plate-loaded machine is the
  // only type entered per side (it's how those machines are loaded and
  // read), so its input shows half the total and doubles what's typed.
  const perSideInput = loadingType === "PLATE_LOADED";
  const toDisplayed = (total: number) =>
    perSideInput ? round1(total / 2) : total;
  const toTotal = (displayed: number) =>
    perSideInput ? displayed * 2 : displayed;
  const displayedWeight = toDisplayed(set.weight);

  const barbell = loadingType === "BARBELL";
  const platesPerSide = barbell
    ? Math.max(0, round1((set.weight - barWeight) / 2))
    : 0;
  const { plates, remainder } = barbell
    ? calculatePlates(platesPerSide, unit)
    : { plates: [], remainder: 0 };

  const [justCompleted, setJustCompleted] = useState(false);
  const [weightGain, setWeightGain] = useState<{ amount: number; key: number } | null>(
    null,
  );
  // Captures the displayed value when editing starts, just to confirm the
  // user actually changed something this edit (avoids re-firing the badge
  // on every blur of an already-correct field).
  const weightOnFocusRef = useRef(0);

  const handleToggleCompleted = () => {
    if (!set.completed) {
      playSetCompleteSound();
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 400);
    }
    onToggleCompleted();
  };

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
          <div
            data-tour="session-set-weight"
            className="relative bg-gray-100 rounded-2xl p-3"
          >
            {weightGain && (
              <span
                key={weightGain.key}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3a9e6e] text-white text-xs font-bold rounded-full px-2.5 py-1 shadow-lg whitespace-nowrap animate-weight-gain-pop"
              >
                +{weightGain.amount}
                {unit}
              </span>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              {t(loadingType ? WEIGHT_LABEL_KEYS[loadingType] : "session.weight")}
            </p>
            <div className="flex items-baseline gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={displayedWeight === 0 ? "" : displayedWeight}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  const num =
                    val === "" ? 0 : clamp(Number(val), MIN_WEIGHT, MAX_WEIGHT);
                  onLocalWeightChange(toTotal(num));
                }}
                onFocus={(e) => {
                  e.target.select();
                  weightOnFocusRef.current = displayedWeight;
                }}
                onBlur={(e) => {
                  const raw =
                    e.target.value === ""
                      ? 0
                      : clamp(Number(e.target.value), MIN_WEIGHT, MAX_WEIGHT);
                  onCommitWeight(toTotal(raw));

                  // previousBest comes from last time's TOTAL weight for
                  // this exercise — convert to the same per-side/total
                  // basis the input itself displays before comparing.
                  const previousBestDisplayed = toDisplayed(previousBest);
                  const changed = raw !== weightOnFocusRef.current;
                  const delta = raw - previousBestDisplayed;
                  if (changed && previousBestDisplayed > 0 && delta > 0) {
                    const amount = Number.isInteger(delta)
                      ? delta
                      : Math.round(delta * 10) / 10;
                    setWeightGain({ amount, key: Date.now() });
                    window.setTimeout(() => setWeightGain(null), 1100);
                  }
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
              {t("session.reps")}
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
            <div className="relative flex-1">
              {justCompleted && (
                <div className="absolute inset-0 rounded-lg bg-[#3a9e6e] animate-set-check-ring" />
              )}
              <button
                data-tour="session-set-check"
                onClick={handleToggleCompleted}
                className={`relative w-full h-full rounded-lg flex items-center justify-center transition-colors ${
                  set.completed
                    ? "bg-[#3a9e6e] text-white"
                    : "bg-gray-900 text-white active:bg-gray-800"
                } ${justCompleted ? "animate-set-check-pop" : ""}`}
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </div>
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
            perSide={platesPerSide}
            unit={unit}
          />
        </div>
      )}

      {perSideInput && set.weight > 0 && (
        <p className="mb-2 pl-14 text-xs font-bold text-[#c9552c]">
          {t("session.total", { weight: round1(set.weight), unit })}
        </p>
      )}
    </div>
  );
}
