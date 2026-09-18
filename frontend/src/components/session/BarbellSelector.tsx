import { BAR_WEIGHTS } from "../../utils/plates";

type Props = {
  unit: string;
  currentBarWeight: number;
  onSelect: (weight: number) => void;
};

export default function BarbellSelector({
  unit,
  currentBarWeight,
  onSelect,
}: Props) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
        Barre
      </p>
      <div className="flex gap-2">
        {(BAR_WEIGHTS[unit] || BAR_WEIGHTS.lb).map((bw) => (
          <button
            key={bw}
            onClick={() => onSelect(bw)}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-colors ${
              currentBarWeight === bw
                ? "bg-[#c9552c] text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {bw} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}
