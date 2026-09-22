import { Play, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  weekActive: boolean;
  setWeekActive: (week: boolean) => void;
};

export default function WeekProgress({ weekActive, setWeekActive }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-5 mt-5">
      {weekActive ? (
        <div className="w-full bg-[#ece7dd] text-gray-900 py-4 rounded-full font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 cursor-default shadow-sm">
          <Check size={18} className="text-[#3a9e6e]" strokeWidth={3} />
          {t("dashboard.weekActive")}
        </div>
      ) : (
        <button
          onClick={() => setWeekActive(true)}
          className="w-full bg-[#191714] active:scale-[0.98] text-white py-4 rounded-full font-bold uppercase tracking-wide text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Play size={16} fill="#f0994a" className="text-[#f0994a]" />
          {t("dashboard.startWeek")}
        </button>
      )}
    </div>
  );
}
