import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { LOADING_TYPES, type LoadingType } from "../../utils/loadingType";
import BottomSheet from "../BottomSheet";

type Props = {
  exerciseName: string;
  current: LoadingType;
  isOverridden: boolean;
  onSelect: (type: LoadingType | null) => void;
  onClose: () => void;
};

// A bottom sheet rather than an inline menu: it never stretches the
// exercise card (which can already be long with many sets) and is always
// fully visible.
export default function LoadingTypeSheet({
  exerciseName,
  current,
  isOverridden,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      title={t("session.loadingType.menuTitle")}
      subtitle={exerciseName}
      onClose={onClose}
    >
      {(close) => (
        <>
          <div className="space-y-1">
            {LOADING_TYPES.map((type) => {
              const selected = type === current;
              return (
                <button
                  key={type}
                  onClick={() => close(() => onSelect(type))}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-[#c9552c]/10 text-[#c9552c]"
                      : "text-gray-800 active:bg-gray-50"
                  }`}
                >
                  {t(`session.loadingType.${type}`)}
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>

          {isOverridden && (
            <button
              onClick={() => close(() => onSelect(null))}
              className="w-full mt-2 px-4 py-3 text-sm font-semibold text-gray-500 active:bg-gray-50 rounded-xl border-t border-gray-100 transition-colors"
            >
              {t("session.loadingType.reset")}
            </button>
          )}
        </>
      )}
    </BottomSheet>
  );
}
