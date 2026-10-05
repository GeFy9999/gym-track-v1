import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { formatDuration } from "../../utils/units";
import BottomSheet from "../BottomSheet";

const REST_DURATION_OPTIONS = [30, 60, 90, 120, 180];

type Props = {
  exerciseName: string;
  currentDuration: number;
  onSelect: (seconds: number) => void;
  onClose: () => void;
};

// Bottom sheet (like the loading-type picker) so choosing a rest duration
// never stretches the exercise card.
export default function RestTimerPicker({
  exerciseName,
  currentDuration,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [customDuration, setCustomDuration] = useState("");
  const customValue = Number(customDuration);

  return (
    <BottomSheet
      title={t("session.restTimer.label")}
      subtitle={exerciseName}
      onClose={onClose}
    >
      {(close) => (
        <>
          <div className="space-y-1">
            {REST_DURATION_OPTIONS.map((s) => {
              const selected = currentDuration === s;
              return (
                <button
                  key={s}
                  onClick={() => close(() => onSelect(s))}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-[#c9552c]/10 text-[#c9552c]"
                      : "text-gray-800 active:bg-gray-50"
                  }`}
                >
                  {formatDuration(s)}
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
            <input
              type="number"
              inputMode="numeric"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder={t("session.restTimer.custom")}
              className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9552c]"
            />
            <button
              onClick={() => {
                if (customValue > 0) close(() => onSelect(customValue));
              }}
              disabled={!customDuration || customValue <= 0}
              className="bg-[#c9552c] disabled:opacity-50 text-white text-sm font-bold px-5 rounded-xl"
            >
              OK
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
