import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  getSetTypeOptions,
  SET_TYPE_LETTERS,
  getSetTypeColor,
  getSetTypeAccent,
} from "../../utils/setTypes";

type Props = {
  currentType: string;
  isClosing: boolean;
  onSelect: (type: string) => void;
};

export default function SetTypeMenu({
  currentType,
  isClosing,
  onSelect,
}: Props) {
  useTranslation();
  return (
    <div
      className={`mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 grid grid-cols-2 gap-1.5 origin-top ${
        isClosing ? "animate-menu-close" : "animate-slide-down"
      }`}
    >
      {getSetTypeOptions().map((opt) => {
        const selected = currentType === opt.value;
        const accent = getSetTypeAccent(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors"
            style={{
              borderColor: selected ? accent : "#e5e7eb",
              backgroundColor: selected ? `${accent}14` : "#f9fafb",
            }}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getSetTypeColor(
                opt.value,
              )}`}
            >
              {SET_TYPE_LETTERS[opt.value]}
            </span>
            <span
              className="flex-1 text-left text-xs font-semibold truncate"
              style={{ color: selected ? accent : "#374151" }}
            >
              {opt.label}
            </span>
            {selected && (
              <Check
                size={14}
                strokeWidth={3}
                style={{ color: accent }}
                className="flex-shrink-0"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
