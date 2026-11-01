import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import {
  getSetTypeOptions,
  SET_TYPE_LETTERS,
  getSetTypeColor,
} from "../../utils/setTypes";
import BottomSheet from "../BottomSheet";

type Props = {
  currentType: string;
  onSelect: (type: string) => void;
  onClose: () => void;
};

// Bottom sheet, same as the rest timer picker, so picking a set type never
// pushes the rest of the card around.
export default function SetTypeMenu({ currentType, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <BottomSheet title={t("session.setTypeTitle")} onClose={onClose}>
      {(close) => (
        <div className="space-y-1">
          {getSetTypeOptions().map((opt) => {
            const selected = currentType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => close(() => onSelect(opt.value))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  selected
                    ? "bg-[#c9552c]/10 text-[#c9552c]"
                    : "text-gray-800 active:bg-gray-50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getSetTypeColor(
                    opt.value,
                  )}`}
                >
                  {SET_TYPE_LETTERS[opt.value]}
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
                {selected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
