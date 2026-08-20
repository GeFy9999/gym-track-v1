import { useEffect, useState } from "react";
import { getWeightUnit } from "../../utils/units";
import { API_URL } from "../../lib/api";

type BodyWeightEntry = {
  id: string;
  value: number;
  date: string;
};

const MONTHS = [
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

export default function ProgressChart() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
    };
    fetchWeights();
  }, []);

  if (entries.length === 0) {
    const fakePoints = [40, 55, 45, 60, 50, 65];
    const fakeMax = Math.max(...fakePoints);
    const cw = 300;
    const ch = 120;

    const fakePath = fakePoints
      .map((p, i) => {
        const x = (i / (fakePoints.length - 1)) * cw;
        const y = ch - (p / fakeMax) * ch * 0.8 - ch * 0.1;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="opacity-20">
          <svg
            viewBox={`0 0 ${cw} ${ch}`}
            className="w-full h-36"
            preserveAspectRatio="none"
          >
            <path
              d={`${fakePath} L ${cw} ${ch} L 0 ${ch} Z`}
              fill="rgba(201,85,44,0.15)"
            />
            <path d={fakePath} fill="none" stroke="#c9552c" strokeWidth="2" />
            {fakePoints.map((p, i) => (
              <circle
                key={i}
                cx={(i / (fakePoints.length - 1)) * cw}
                cy={ch - (p / fakeMax) * ch * 0.8 - ch * 0.1}
                r="4"
                fill="#c9552c"
              />
            ))}
          </svg>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-mm text-gray-800 font-bold mb-1">
            Pas encore de données
          </p>
          <p className="text-s text-[#c9552c]">
            Ton poids sera enregistré chaque semaine
          </p>
        </div>
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

  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

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
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col items-center mb-4">
        <span className="text-xs text-gray-500 mb-2">
          Poids corporel ({getWeightUnit()})
        </span>

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
            au total
          </span>
        )}

        {activeIndex !== null && (
          <span className="text-xs text-gray-500 mt-1">
            {new Date(entries[activeIndex].date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}
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
  );
}
