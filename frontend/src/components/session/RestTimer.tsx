import { Timer, X } from "lucide-react";

type Props = {
  secondsLeft: number;
  onSkip: () => void;
};

export default function RestTimer({ secondsLeft, onSkip }: Props) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full shadow-lg pl-4 pr-2 py-2 flex items-center gap-2.5 animate-slide-down">
      <Timer size={16} className="text-[#c9552c]" />
      <span className="text-sm font-semibold tabular-nums">{label}</span>
      <span className="text-xs text-gray-400">Repos</span>
      <button
        onClick={onSkip}
        className="w-7 h-7 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors"
        aria-label="Passer le temps de repos"
      >
        <X size={14} className="text-white" />
      </button>
    </div>
  );
}
