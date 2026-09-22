import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWeightUnit } from "../../utils/units";
import { getDateLocale } from "../../i18n";
import { API_URL } from "../../lib/api";
import ProgressLineChart from "../charts/ProgressLineChart";

type BodyWeightEntry = {
  id: string;
  value: number;
  date: string;
};

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function ProgressChart() {
  const { t, i18n } = useTranslation();
  const MONTHS = i18n.language?.startsWith("en") ? MONTHS_EN : MONTHS_FR;
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeights = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/body-weight`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
      setLoading(false);
    };
    fetchWeights();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#ece7dd] rounded-3xl p-4 shadow-sm animate-pulse">
        <div className="h-32 bg-white/60 rounded-2xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-[#ece7dd] rounded-3xl p-4 shadow-sm">
        <ProgressLineChart
          title={t("stats.bodyWeight")}
          subtitle={getWeightUnit().toUpperCase()}
          points={[]}
          emptyTitle={t("stats.noData")}
          emptyHint={t("stats.weightWillBeSaved")}
        />
      </div>
    );
  }

  const maxVal = Math.max(...entries.map((e) => e.value));
  const minVal = Math.min(...entries.map((e) => e.value));
  const range = maxVal - minVal || 1;
  const padding = range * 0.2;

  const chartHeight = 120;
  const chartWidth = 300;

  const getY = (val: number) => {
    return (
      chartHeight -
      ((val - minVal + padding) / (range + padding * 2)) * chartHeight
    );
  };

  const getX = (i: number) => {
    if (entries.length === 1) return chartWidth / 2;
    return (i / (entries.length - 1)) * chartWidth;
  };

  const linePath = entries
    .map((e, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(e.value)}`)
    .join(" ");

  const dates = entries.map((e) => new Date(e.date));

  const handleChartClick = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
  ) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * chartWidth;

    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const dist = Math.abs(getX(i) - x);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  };

  const totalDiff =
    entries.length >= 2
      ? Math.round(
          (entries[entries.length - 1].value - entries[0].value) * 10,
        ) / 10
      : 0;

  return (
    <div className="bg-[#ece7dd] rounded-3xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-base font-black text-gray-900 uppercase tracking-wide">
          {t("stats.bodyWeight")}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-1">
          {getWeightUnit()}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-3">
      <div className="flex flex-col items-center mb-2">
        <span className="text-3xl font-black text-gray-900">
          {activeIndex !== null
            ? `${Math.round(entries[activeIndex].value)} ${getWeightUnit()}`
            : `${Math.round(entries[entries.length - 1].value)} ${getWeightUnit()}`}
        </span>

        {activeIndex === null && entries.length >= 2 && (
          <span
            className={`text-sm font-semibold mt-1 ${totalDiff > 0 ? "text-[#c9552c]" : "text-gray-500"}`}
          >
            {totalDiff > 0 ? "↑" : "↓"} {Math.abs(totalDiff)} {getWeightUnit()}{" "}
            {t("stats.sessionsTotal")}
          </span>
        )}

        {activeIndex !== null && (
          <span className="text-xs text-gray-500 mt-1">
            {new Date(entries[activeIndex].date).toLocaleDateString(
              getDateLocale(),
              { day: "numeric", month: "long" },
            )}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-36"
        preserveAspectRatio="none"
        onClick={handleChartClick}
        onTouchStart={handleChartClick}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchEnd={() => setActiveIndex(null)}
      >
        <path d={linePath} fill="none" stroke="#c9552c" strokeWidth="2.5" />

        {activeIndex !== null && (
          <line
            x1={getX(activeIndex)}
            y1={0}
            x2={getX(activeIndex)}
            y2={chartHeight}
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {entries.map((e, i) => (
          <circle
            key={e.id}
            cx={getX(i)}
            cy={getY(e.value)}
            r={activeIndex === i ? 6 : 4}
            fill={activeIndex === i ? "white" : "#c9552c"}
            stroke={activeIndex === i ? "#c9552c" : "#faf6f1"}
            strokeWidth="2"
          />
        ))}
      </svg>

      <div className="flex justify-between mt-2 border-t border-gray-100 pt-2">
        {dates.map((d, i) => {
          const showMonth = i === 0 || d.getMonth() !== dates[i - 1].getMonth();
          return (
            <div key={entries[i].id} className="flex-1 text-center">
              <span
                className={`text-xs ${activeIndex === i ? "text-[#c9552c] font-semibold" : "text-gray-500"}`}
              >
                {d.getDate()}
              </span>
              {showMonth && (
                <p className="text-xs text-gray-500 -mt-0.5">
                  {MONTHS[d.getMonth()]}
                </p>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
