import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Timer } from "lucide-react";

type Props = {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
  exiting?: boolean;
};

const RING_RADIUS = 86;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const DRAG_THRESHOLD = 60;
const TAP_THRESHOLD = 6;
const DISMISS_DISTANCE = 420;

export default function RestTimer({
  secondsLeft,
  totalSeconds,
  onSkip,
  onAdjust,
  exiting = false,
}: Props) {
  const { t } = useTranslation();
  const [minimized, setMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = secondsLeft > 0 && secondsLeft <= 5;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Without this, a mouse drag starting on text (e.g. the "Repos" label)
    // makes the browser begin a native text-selection drag, which fires a
    // pointercancel and kills the gesture before any movement is tracked.
    // Touch doesn't trigger this the same way, which is why it only broke
    // on desktop mouse testing.
    e.preventDefault();
    const pointerId = e.pointerId;
    const startY = e.clientY;
    const wasMinimized = minimized;
    let maxMove = 0;
    setDragging(true);

    const handleMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const delta = ev.clientY - startY;
      maxMove = Math.max(maxMove, Math.abs(delta));
      setDragOffset(wasMinimized ? Math.min(0, delta) : Math.max(0, delta));
    };

    const handleUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      const delta = ev.clientY - startY;

      if (!wasMinimized && delta > DRAG_THRESHOLD) {
        // Let go past the dismiss threshold: finish the slide down
        // smoothly (transition back on) instead of snapping offscreen.
        setDragging(false);
        setDragOffset(DISMISS_DISTANCE);
        window.setTimeout(() => {
          setMinimized(true);
          setDragOffset(0);
        }, 300);
        return;
      }

      if (wasMinimized && (delta < -DRAG_THRESHOLD || maxMove < TAP_THRESHOLD)) {
        setMinimized(false);
      }

      setDragging(false);
      setDragOffset(0);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  if (minimized) {
    return (
      <div
        onPointerDown={exiting ? undefined : handlePointerDown}
        style={{
          bottom: "var(--bottom-nav-height, 0px)",
          ...(exiting
            ? undefined
            : {
                transform: `translateY(${dragOffset}px)`,
                transition: dragging ? "none" : "transform 0.3s ease-out",
                touchAction: "none",
              }),
        }}
        className={`fixed inset-x-0 z-40 touch-none select-none cursor-grab active:cursor-grabbing ${
          exiting ? "pointer-events-none" : ""
        }`}
      >
        <div
          className={`mx-auto max-w-md bg-[#191714] text-white rounded-t-2xl shadow-2xl px-5 py-3 flex items-center gap-3 ${
            exiting ? "animate-bar-slide-down" : "animate-bar-slide-up"
          }`}
        >
          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={isUrgent ? "#e2703a" : "#c9552c"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={2 * Math.PI * 15 * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-[1000ms] ease-linear"
              />
            </svg>
            <Timer size={14} className={isUrgent ? "text-[#e2703a]" : "text-[#c9552c]"} />
          </div>
          <div className="flex flex-col leading-none flex-1 min-w-0">
            <span className="text-lg font-bold tabular-nums">{label}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              {t("session.restTimer.label")}
            </span>
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="text-xs font-bold uppercase tracking-wide bg-white/10 active:bg-white/20 rounded-full px-4 py-2 transition-colors"
          >
            {t("session.restTimer.skip")}
          </button>
        </div>
      </div>
    );
  }

  const closing = exiting;

  return (
    <div
      style={{
        bottom: "var(--bottom-nav-height, 0px)",
        transform: `translateY(${dragOffset}px)`,
        transition: dragging ? "none" : "transform 0.3s ease-out",
      }}
      className={`fixed inset-x-0 z-40 ${
        closing ? "animate-sheet-slide-down pointer-events-none" : "animate-sheet-slide-up"
      }`}
    >
      <div className="mx-auto max-w-md bg-[#faf6f1] rounded-t-[1.75rem] shadow-2xl pb-8">
        <div
          onPointerDown={closing ? undefined : handlePointerDown}
          style={{ touchAction: "none" }}
          className="touch-none select-none cursor-grab active:cursor-grabbing"
          role="button"
          aria-label={t("session.restTimer.expandAria")}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1.5 rounded-full bg-[#191714]/15" />
          </div>
          <p className="text-center text-xs font-bold text-[#191714]/40 uppercase tracking-widest mb-6 pb-1">
            {t("session.restTimer.label")}
          </p>
        </div>

        <div
          className={`relative w-48 h-48 mx-auto flex items-center justify-center mb-7 ${
            isUrgent ? "animate-timer-urgent" : ""
          }`}
        >
          <svg viewBox="0 0 192 192" className="absolute inset-0 -rotate-90">
            <circle cx="96" cy="96" r={RING_RADIUS} fill="none" stroke="#ece7dd" strokeWidth="10" />
            <circle
              cx="96"
              cy="96"
              r={RING_RADIUS}
              fill="none"
              stroke={isUrgent ? "#e2703a" : "#c9552c"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-[1000ms] ease-linear"
            />
          </svg>
          <span className="text-5xl font-black text-[#191714] tabular-nums">{label}</span>
        </div>

        <div className="flex items-center gap-3 px-6">
          <button
            onClick={() => onAdjust(-15)}
            aria-label={t("session.restTimer.removeAria")}
            className="flex-1 bg-[#ece7dd] active:bg-[#e2dccf] text-[#191714] font-bold text-sm rounded-full py-3.5 transition-colors"
          >
            {t("session.restTimer.remove")}
          </button>
          <button
            onClick={() => onAdjust(15)}
            aria-label={t("session.restTimer.addAria")}
            className="flex-1 bg-[#ece7dd] active:bg-[#e2dccf] text-[#191714] font-bold text-sm rounded-full py-3.5 transition-colors"
          >
            {t("session.restTimer.add")}
          </button>
          <button
            onClick={onSkip}
            aria-label={t("session.restTimer.skipAria")}
            className="flex-1 bg-[#191714] active:bg-[#191714]/85 text-white font-bold text-sm rounded-full py-3.5 transition-colors"
          >
            {t("session.restTimer.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
