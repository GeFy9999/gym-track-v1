import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { LOADING_TYPES, type LoadingType } from "../../utils/loadingType";

type Props = {
  exerciseName: string;
  current: LoadingType;
  isOverridden: boolean;
  onSelect: (type: LoadingType | null) => void;
  onClose: () => void;
};

// Matches .animate-sheet-slide-down in index.css.
const EXIT_MS = 300;

// A bottom sheet rather than an inline menu: it never stretches the
// exercise card (which can already be long with many sets) and is always
// fully visible. Portaled to <body> because the card's own transform
// animation would otherwise turn `position: fixed` into card-relative.
export default function LoadingTypeSheet({
  exerciseName,
  current,
  isOverridden,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);

  const close = (then?: () => void) => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      then?.();
      onClose();
    }, EXIT_MS);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          closing ? "opacity-0" : "animate-fade-in"
        }`}
        onClick={() => close()}
      />
      <div
        className={`absolute inset-x-0 bottom-0 ${
          closing ? "animate-sheet-slide-down" : "animate-sheet-slide-up"
        }`}
      >
        <div
          className="mx-auto max-w-md bg-white rounded-t-[1.75rem] shadow-2xl pt-3 px-4"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex justify-center pb-3">
            <div className="w-10 h-1.5 rounded-full bg-[#191714]/15" />
          </div>
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {t("session.loadingType.menuTitle")}
          </p>
          <p className="text-center text-sm font-black uppercase text-gray-900 mt-1 mb-3 truncate px-4">
            {exerciseName}
          </p>

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
        </div>
      </div>
    </div>,
    document.body,
  );
}
