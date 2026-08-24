import { Play, Check } from "lucide-react";

type Props = {
  weekActive: boolean;
  setWeekActive: (week: boolean) => void;
};

export default function WeekProgress({ weekActive, setWeekActive }: Props) {
  return (
    <div className="px-5 mt-4">
      {weekActive ? (
        <div className="w-full bg-gray-200 text-gray-400 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2.5 cursor-default">
          <Check size={18} />
          Semaine en cours
        </div>
      ) : (
        <button
          onClick={() => setWeekActive(true)}
          className="w-full bg-[#c9552c] active:scale-[0.98] text-white py-4 rounded-2xl font-semibold text-base transition-all shadow-md flex items-center justify-center gap-2.5"
        >
          <Play size={18} fill="white" />
          Commencer la semaine
        </button>
      )}
    </div>
  );
}
