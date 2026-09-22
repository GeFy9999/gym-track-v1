import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, X } from "lucide-react";

type Props = {
  exerciseName: string;
  weight: number;
  unit: string;
  onClose: () => void;
};

const CONFETTI_COLORS = ["#c9552c", "#f0b429", "#3a9e6e", "#ffffff", "#e8622b"];

export default function PRCelebration({
  exerciseName,
  weight,
  unit,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        size: 6 + Math.random() * 6,
        rounded: Math.random() > 0.5,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-6 animate-fade-in overflow-hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 pointer-events-none">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="animate-confetti absolute top-0"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: c.rounded ? "9999px" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative animate-pop-in w-full max-w-xs rounded-3xl p-7 text-center shadow-2xl"
        style={{
          background:
            "linear-gradient(160deg, #e8622b 0%, #c9552c 55%, #a8431f 100%)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/80"
          aria-label={t("session.pr.close")}
        >
          <X size={14} />
        </button>

        <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Trophy size={30} className="text-[#ffe6b8]" fill="#ffe6b8" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 mb-1">
          {t("session.pr.congrats")}
        </p>

        <div className="flex items-baseline justify-center gap-1.5 my-2">
          <span className="text-6xl font-black text-white leading-none">
            {weight}
          </span>
          <span className="text-lg font-bold text-white/80">{unit}</span>
        </div>

        <p className="text-sm font-bold uppercase tracking-wide text-white/90">
          {exerciseName}
        </p>
      </div>
    </div>
  );
}
