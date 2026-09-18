import { useState } from "react";
import { formatDuration } from "../../utils/units";

const REST_DURATION_OPTIONS = [30, 60, 90, 120, 180];

type Props = {
  currentDuration: number;
  isClosing: boolean;
  onSelect: (seconds: number) => void;
};

export default function RestTimerPicker({
  currentDuration,
  isClosing,
  onSelect,
}: Props) {
  const [customDuration, setCustomDuration] = useState("");

  return (
    <div
      className={`mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 origin-top ${
        isClosing ? "animate-menu-close" : "animate-slide-down"
      }`}
    >
      {REST_DURATION_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
            currentDuration === s
              ? "bg-[#c9552c]/10 text-[#c9552c] font-semibold"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {formatDuration(s)}
        </button>
      ))}
      <div className="flex gap-2 px-1 pt-1 mt-1 border-t border-gray-100">
        <input
          type="number"
          value={customDuration}
          onChange={(e) => setCustomDuration(e.target.value)}
          placeholder="Custom (s)"
          className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#c9552c]"
        />
        <button
          onClick={() => {
            const val = Number(customDuration);
            if (val > 0) {
              onSelect(val);
              setCustomDuration("");
            }
          }}
          disabled={!customDuration || Number(customDuration) <= 0}
          className="bg-[#c9552c] disabled:opacity-50 text-white text-sm font-semibold px-3 rounded-lg"
        >
          OK
        </button>
      </div>
    </div>
  );
}
