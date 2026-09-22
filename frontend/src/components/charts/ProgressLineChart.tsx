export type SeriesPoint = { date: string; value: number };

// A generic example series shown (grayed out) when there's no real data yet,
// so the empty state still reads as "a chart like this will show up here"
// rather than a bare sentence — spread over the last few months like a
// plausible training cadence.
function buildFakeSeries(): SeriesPoint[] {
  // A gentle overall upward trend with small realistic dips — like actual
  // progressive-overload data — rather than a fully random zigzag.
  const values = [52, 55, 53, 57, 56, 60, 58, 63, 61, 65, 64, 68, 70];
  // Irregular day gaps between points (not one-per-week) so the ghost
  // chart doesn't look like an obviously synthetic, evenly-spaced grid.
  const gaps = [11, 8, 14, 6, 12, 9, 15, 7, 13, 10, 8, 12];
  const now = Date.now();
  const dayMs = 86400000;

  const daysAgo: number[] = [0];
  for (let i = gaps.length - 1; i >= 0; i--) {
    daysAgo.unshift(daysAgo[0] + gaps[i]);
  }

  return values.map((value, i) => ({
    date: new Date(now - daysAgo[i] * dayMs).toISOString(),
    value,
  }));
}

// Loosely inspired by Strong's exercise charts: title/subtitle in the
// corner, a broken line with a dot per session, gridlines with values on
// the right, and dates along the bottom — reworked with this app's own
// look (accent color, rounder card) rather than copied wholesale. Renders
// a grayed-out example series with an overlay message when `points` is
// empty, instead of a bare "no data" sentence.
export default function ProgressLineChart({
  title,
  subtitle,
  points,
  emptyTitle = "Pas encore assez de données",
  emptyHint,
}: {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const isEmpty = points.length === 0;
  const displayPoints = isEmpty ? buildFakeSeries() : points;

  const lineColor = isEmpty ? "#c1c5cc" : "#c9552c";
  const gridColor = isEmpty ? "#f3f4f6" : "#f0ede8";
  const textColor = "#9ca3af";

  const w = 300;
  const h = 130;
  const marginRight = 28;
  const marginBottom = 18;
  const chartW = w - marginRight;
  const chartH = h - marginBottom;

  const values = displayPoints.map((p) => p.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.2;
  const domainMin = minVal - padding;
  const domainMax = maxVal + padding;
  const domainRange = domainMax - domainMin || 1;

  const getX = (i: number) =>
    displayPoints.length === 1 ? chartW / 2 : (i / (displayPoints.length - 1)) * chartW;
  const getY = (v: number) => chartH - ((v - domainMin) / domainRange) * chartH;

  const coords = displayPoints.map((p, i) => ({ x: getX(i), y: getY(p.value) }));

  // Straight segments joining each point directly — a "broken line", not a
  // smoothed curve, so the chart shows exactly the recorded values.
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const GRID_STEPS = 4;
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) =>
    Math.round(domainMin + (domainRange * i) / GRID_STEPS),
  ).reverse();

  const xLabelCount = Math.min(5, displayPoints.length);
  const xLabelIndices =
    xLabelCount <= 1
      ? [0]
      : Array.from({ length: xLabelCount }, (_, i) =>
          Math.round((i * (displayPoints.length - 1)) / (xLabelCount - 1)),
        );

  return (
    <div>
      <div className="mb-3 flex items-start justify-between">
        <p className="text-base font-black text-gray-900 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="relative bg-white rounded-2xl p-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block">
          {gridValues.map((v, i) => {
            const y = getY(v);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke={gridColor} strokeWidth="1" />
                <text x={chartW + 5} y={y + 3} fontSize="8" fill={textColor}>
                  {isEmpty ? "—" : v}
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={2.6}
              fill={lineColor}
              stroke="white"
              strokeWidth="1.2"
            />
          ))}

          {xLabelIndices.map((idx) => (
            <text
              key={idx}
              x={getX(idx)}
              y={chartH + 14}
              fontSize="8"
              fill={textColor}
              textAnchor="middle"
            >
              {isEmpty
                ? ""
                : new Date(displayPoints[idx].date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
            </text>
          ))}
        </svg>

        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <p className="text-sm font-black text-gray-900 text-center">
              {emptyTitle}
            </p>
            {emptyHint && (
              <p className="text-xs font-semibold text-[#c9552c] text-center mt-1">
                {emptyHint}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
