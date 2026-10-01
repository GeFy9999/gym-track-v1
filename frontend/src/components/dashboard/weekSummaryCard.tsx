import { useTranslation } from "react-i18next";

type Props = {
  completed: number;
  total: number;
};

export default function WeekSummaryCard({ completed, total }: Props) {
  const { t } = useTranslation();

  const ringRadius = 34;
  const circumference = 2 * Math.PI * ringRadius;
  const pct = total > 0 ? completed / total : 0;
  const ringOffset = circumference * (1 - pct);

  const title =
    completed === 0
      ? t("dashboard.weekSummary.titleStart")
      : completed >= total && total > 0
        ? t("dashboard.weekSummary.titleDone")
        : t("dashboard.weekSummary.titleProgress");

  return (
    <div className="px-5 mt-5">
      <div className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={ringRadius}
              fill="none"
              stroke="#d6d0c1"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r={ringRadius}
              fill="none"
              stroke="#c9552c"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-gray-900 leading-none">
              {completed}/{total}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#c9552c] uppercase tracking-widest">
            {t("dashboard.weekSummary.label")}
          </p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("dashboard.weekSummary.desc", { completed, total })}
          </p>
        </div>
      </div>
    </div>
  );
}
