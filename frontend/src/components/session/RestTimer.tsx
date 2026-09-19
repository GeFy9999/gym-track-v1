import { Timer, X, Minus, Plus } from "lucide-react";

type Props = {
  secondsLeft: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
};

export default function RestTimer({ secondsLeft, onSkip, onAdjust }: Props) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full shadow-xl pl-4 pr-2 py-2.5 flex items-center gap-2.5 animate-timer-pop-in">
      <Timer size={19} className="text-[#c9552c] flex-shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold tabular-nums">{label}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          Repos
        </span>
      </div>
      <div className="flex items-center gap-1.5 pl-1">
        <button
          onClick={() => onAdjust(-5)}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Retirer 5 secondes"
        >
          <Minus size={14} className="text-white" />
        </button>
        <button
          onClick={() => onAdjust(5)}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Ajouter 5 secondes"
        >
          <Plus size={14} className="text-white" />
        </button>
        <button
          onClick={onSkip}
          className="w-8 h-8 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors ml-1"
          aria-label="Passer le temps de repos"
        >
          <X size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
