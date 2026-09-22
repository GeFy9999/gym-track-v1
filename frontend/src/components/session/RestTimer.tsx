import { useTranslation } from "react-i18next";
import { Timer, X, Minus, Plus } from "lucide-react";

type Props = {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
};

const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function RestTimer({
  secondsLeft,
  totalSeconds,
  onSkip,
  onAdjust,
}: Props) {
  const { t } = useTranslation();
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = secondsLeft > 0 && secondsLeft <= 5;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full shadow-xl pl-4 pr-2 py-2.5 flex items-center gap-2.5 animate-timer-pop-in ${
        isUrgent ? "animate-timer-urgent" : ""
      }`}
    >
      <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2.5"
          />
          <circle
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            stroke={isUrgent ? "#e2703a" : "#c9552c"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-[1000ms] ease-linear"
          />
        </svg>
        <Timer
          size={16}
          className={isUrgent ? "text-[#e2703a]" : "text-[#c9552c]"}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold tabular-nums">{label}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          {t("session.restTimer.label")}
        </span>
      </div>
      <div className="flex items-center gap-1.5 pl-1">
        <button
          onClick={() => onAdjust(-5)}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors"
          aria-label={t("session.restTimer.removeAria")}
        >
          <Minus size={14} className="text-white" />
        </button>
        <button
          onClick={() => onAdjust(5)}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors"
          aria-label={t("session.restTimer.addAria")}
        >
          <Plus size={14} className="text-white" />
        </button>
        <button
          onClick={onSkip}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors ml-1"
          aria-label={t("session.restTimer.skipAria")}
        >
          <X size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
