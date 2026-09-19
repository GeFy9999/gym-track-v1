import { useState } from "react";
import { Flame, Minus, Plus } from "lucide-react";
import {
  computeWarmupSets,
  MIN_WARMUP_SETS,
  MAX_WARMUP_SETS,
  DEFAULT_WARMUP_SETS,
} from "../../utils/warmup";
import { MIN_WEIGHT, MAX_WEIGHT, MIN_REPS, MAX_REPS } from "../../utils/plates";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

type Props = {
  unit: string;
  onClose: () => void;
  onConfirm: (workingWeight: number, workingReps: number, count: number) => void;
};

export default function WarmupModal({ unit, onClose, onConfirm }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("8");
  const [count, setCount] = useState(DEFAULT_WARMUP_SETS);

  const workingWeight =
    weight === "" ? 0 : clamp(Number(weight), MIN_WEIGHT, MAX_WEIGHT);
  const workingReps =
    reps === "" ? 0 : clamp(Number(reps), MIN_REPS, MAX_REPS);
  const plan =
    workingWeight > 0 ? computeWarmupSets(workingWeight, unit, count) : [];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame size={18} className="text-[#c9552c]" />
          <p className="text-base font-bold text-gray-900">
            Échauffement auto
          </p>
        </div>
        <p className="text-sm text-gray-400 text-center mb-4">
          Entre ton poids de travail, on génère la montée en charge.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-100 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Poids de travail
            </p>
            <div className="flex items-baseline gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={weight}
                placeholder="0"
                onChange={(e) =>
                  setWeight(e.target.value.replace(/[^0-9.]/g, ""))
                }
                autoFocus
                className="w-full min-w-0 bg-transparent text-2xl font-black text-gray-900 focus:outline-none"
              />
              <span className="text-sm font-bold text-gray-400 flex-shrink-0">
                {unit}
              </span>
            </div>
          </div>
          <div className="bg-gray-100 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Reps de travail
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={reps}
              placeholder="0"
              onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full min-w-0 bg-transparent text-2xl font-black text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-3 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Nombre de sets d'échauffement
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(MIN_WARMUP_SETS, c - 1))}
              disabled={count <= MIN_WARMUP_SETS}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 disabled:opacity-30 flex items-center justify-center text-gray-600"
            >
              <Minus size={12} strokeWidth={3} />
            </button>
            <span className="text-base font-black text-gray-900 w-4 text-center">
              {count}
            </span>
            <button
              onClick={() =>
                setCount((c) => Math.min(MAX_WARMUP_SETS, c + 1))
              }
              disabled={count >= MAX_WARMUP_SETS}
              className="w-7 h-7 rounded-full bg-white border border-gray-300 disabled:opacity-30 flex items-center justify-center text-gray-600"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {plan.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-1.5">
            {plan.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-400">Échauffement {i + 1}</span>
                <span className="font-semibold text-gray-800">
                  {s.weight} {unit} × {s.reps}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
              <span className="text-[#c9552c] font-semibold">
                Set de travail
              </span>
              <span className="font-bold text-[#c9552c]">
                {workingWeight} {unit} × {workingReps}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(workingWeight, workingReps, count)}
            disabled={workingWeight <= 0 || workingReps <= 0}
            className="flex-1 bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Générer
          </button>
        </div>
      </div>
    </div>
  );
}
