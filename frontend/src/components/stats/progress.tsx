import { useEffect, useState } from "react";
import { getWeightUnit } from "../../utils/units";

const API_URL = "/api";

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
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 relative overflow-hidden">
        <div className="opacity-20">
          <svg
            viewBox={`0 0 ${cw} ${ch}`}
            className="w-full h-36"
            preserveAspectRatio="none"
          >
            <path
              d={`${fakePath} L ${cw} ${ch} L 0 ${ch} Z`}
              fill="rgba(249,115,22,0.15)"
            />
            <path
              d={fakePath}
              fill="none"
              stroke="rgb(249,115,22)"
              strokeWidth="2"
            />
            {fakePoints.map((p, i) => (
              <circle
                key={i}
                cx={(i / (fakePoints.length - 1)) * cw}
                cy={ch - (p / fakeMax) * ch * 0.8 - ch * 0.1}
                r="4"
                fill="rgb(249,115,22)"
              />
            ))}
          </svg>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-sm text-zinc-400 font-semibold mb-1">
            Pas encore de données
          </p>
          <p className="text-xs text-zinc-500">
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

  const diff =
    entries.length >= 2
      ? Math.round(
          (entries[entries.length - 1].value -
            entries[entries.length - 2].value) *
            10,
        ) / 10
      : 0;

  const totalDiff =
    entries.length >= 2
      ? Math.round(
          (entries[entries.length - 1].value - entries[0].value) * 10,
        ) / 10
      : 0;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex flex-col items-center mb-4">
        <span className="text-xs text-zinc-500 mb-2">
          Poids corporel ({getWeightUnit()})
        </span>

        <span className="text-2xl font-bold text-white">
          {activeIndex !== null
            ? `${Math.round(entries[activeIndex].value * 10) / 10} ${getWeightUnit()}`
            : `${Math.round(entries[entries.length - 1].value * 10) / 10} ${getWeightUnit()}`}
        </span>

        {activeIndex === null && (
          <div className="flex items-center gap-4 mt-2">
            {diff !== 0 && (
              <span className="text-sm text-orange-400 font-semibold">
                {diff > 0 ? "↑" : "↓"} {Math.abs(diff)} {getWeightUnit()} cette
                semaine
              </span>
            )}
            {entries.length >= 2 && (
              <span className="text-xs text-zinc-400">
                {totalDiff > 0 ? "↑" : "↓"} {Math.abs(totalDiff)}{" "}
                {getWeightUnit()} au total
              </span>
            )}
          </div>
        )}

        {activeIndex !== null && (
          <span className="text-xs text-zinc-400 mt-1">
            {new Date(entries[activeIndex].date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}
          </span>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-36"
        preserveAspectRatio="none"
        onClick={handleChartClick}
        onTouchStart={handleChartClick}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchEnd={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#areaGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="rgb(249, 115, 22)"
          strokeWidth="2"
        />

        {activeIndex !== null && (
          <line
            x1={getX(activeIndex)}
            y1={0}
            x2={getX(activeIndex)}
            y2={chartHeight}
            stroke="rgb(161, 161, 170)"
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
            fill={activeIndex === i ? "white" : "rgb(249, 115, 22)"}
            stroke={activeIndex === i ? "rgb(249, 115, 22)" : "rgb(39, 39, 42)"}
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Date labels */}
      <div className="flex justify-between mt-2 border-t border-zinc-700 pt-2">
        {dates.map((d, i) => {
          const showMonth = i === 0 || d.getMonth() !== dates[i - 1].getMonth();
          return (
            <div key={entries[i].id} className="flex-1 text-center">
              <span
                className={`text-xs ${activeIndex === i ? "text-orange-400 font-semibold" : "text-zinc-500"}`}
              >
                {d.getDate()}
              </span>
              {showMonth && (
                <p className="text-xs text-zinc-600 -mt-0.5">
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
