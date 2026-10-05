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
// Same feel as the rest timer sheet: drag the header down past this many
// pixels and let go to dismiss; less than that snaps back.
const DRAG_THRESHOLD = 60;
const DISMISS_DISTANCE = 600;

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
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const close = (then?: () => void) => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      then?.();
      onClose();
    }, EXIT_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (closing) return;
    // Stops a mouse drag over the title from starting a native text
    // selection, which would cancel the gesture (see RestTimer).
    e.preventDefault();
    const pointerId = e.pointerId;
    const startY = e.clientY;
    setDragging(true);

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      setDragOffset(Math.max(0, ev.clientY - startY));
    };

    const handleUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      setDragging(false);

      if (ev.clientY - startY > DRAG_THRESHOLD) {
        // Finish the slide down from where the finger let go (transition
        // back on) rather than replaying the exit animation from the top.
        setClosing(true);
        setDragOffset(DISMISS_DISTANCE);
        window.setTimeout(onClose, EXIT_MS);
        return;
      }
      setDragOffset(0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  // Closed by dragging: the inline transform drives the slide, so the
  // keyframe exit animation must not also run.
  const draggedClosed = closing && dragOffset > 0;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          closing ? "opacity-0" : "animate-fade-in"
        }`}
        onClick={() => close()}
      />
      <div
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragging ? "none" : "transform 0.3s ease-out",
        }}
        className={`absolute inset-x-0 bottom-0 ${
          draggedClosed
            ? "pointer-events-none"
            : closing
              ? "animate-sheet-slide-down pointer-events-none"
              : "animate-sheet-slide-up"
        }`}
      >
        <div
          className="mx-auto max-w-md bg-white rounded-t-[1.75rem] shadow-2xl pt-3 px-4"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div
            onPointerDown={handlePointerDown}
            style={{ touchAction: "none" }}
            className="-mx-4 -mt-3 pt-3 px-4 touch-none select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1.5 rounded-full bg-[#191714]/15" />
            </div>
            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {t("session.loadingType.menuTitle")}
            </p>
            <p className="text-center text-sm font-black uppercase text-gray-900 mt-1 pb-3 truncate px-4">
              {exerciseName}
            </p>
          </div>

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
