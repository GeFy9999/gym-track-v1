import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import { getDateLocale } from "../../i18n";

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

// What's drawn (blurred) in place of the points a free user can't see: a
// fixed example shape — heights as a share of the plot, 0 = bottom — that
// has nothing to do with their data. The real older points aren't even sent
// to the app, and a blur over anything derived from real numbers could be
// undone in devtools.
const LOCKED_SAMPLE = [0.22, 0.3, 0.26, 0.38, 0.34, 0.46, 0.42, 0.52];
// Share of the plot's width the locked part takes when real points follow.
const LOCKED_SHARE = 0.38;

// Loosely inspired by Strong's exercise charts: title/subtitle in the
// corner, a broken line with a dot per session, gridlines with values on
// the right, and dates along the bottom — reworked with this app's own
// look (accent color, rounder card) rather than copied wholesale. Renders
// a grayed-out example series with an overlay message when `points` is
// empty, instead of a bare "no data" sentence.
//
// Like the body weight chart, touching (or hovering) the chart picks the
// nearest point: it's enlarged, a dashed line marks it, and its value and
// date show above the chart — the latest point's when nothing is picked.
//
// `locked`: older points exist that the plan doesn't include. The start of
// the chart then shows a blurred stand-in for them, with an upgrade button.
export default function ProgressLineChart({
  title,
  subtitle,
  points,
  emptyTitle,
  emptyHint,
  unit,
  locked,
}: {
  title: string;
  subtitle: string;
  points: SeriesPoint[];
  emptyTitle?: string;
  emptyHint?: string;
  // Shown after the picked value ("30 lb").
  unit?: string;
  locked?: {
    count: number;
    label: string;
    buttonLabel: string;
    onUnlock: () => void;
  };
}) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const resolvedEmptyTitle = emptyTitle ?? t("common.notEnoughData");
  const hasLocked = (locked?.count ?? 0) > 0;
  // Only older, locked points: the whole chart is the locked stand-in.
  const fullyLocked = hasLocked && points.length === 0;
  const isEmpty = points.length === 0 && !hasLocked;
  const displayPoints = isEmpty ? buildFakeSeries() : points;
  const noValues = isEmpty || fullyLocked;

  const lineColor = isEmpty ? "#c1c5cc" : "#c9552c";
  // CSS variables so dark mode can swap them (index.css / theme-dark.css).
  const gridColor = "var(--chart-grid)";
  const textColor = "#9ca3af";

  const w = 300;
  const h = 130;
  const marginRight = 28;
  const marginBottom = 18;
  const chartW = w - marginRight;
  const chartH = h - marginBottom;

  const values = displayPoints.map((p) => p.value);
  const maxVal = values.length ? Math.max(...values) : 1;
  const minVal = values.length ? Math.min(...values) : 0;
  const range = maxVal - minVal || 1;
  const padding = range * 0.2;
  const domainMin = minVal - padding;
  const domainMax = maxVal + padding;
  const domainRange = domainMax - domainMin || 1;

  // The locked part takes the left of the plot; real points share the rest.
  const lockedW = fullyLocked ? chartW : hasLocked ? LOCKED_SHARE * chartW : 0;
  const realStart = hasLocked ? lockedW + 8 : 0;
  const getX = (i: number) =>
    displayPoints.length === 1
      ? (realStart + chartW) / 2
      : realStart + (i / (displayPoints.length - 1)) * (chartW - realStart);
  const getY = (v: number) => chartH - ((v - domainMin) / domainRange) * chartH;

  const coords = displayPoints.map((p, i) => ({ x: getX(i), y: getY(p.value) }));

  // Straight segments joining each point directly — a "broken line", not a
  // smoothed curve, so the chart shows exactly the recorded values.
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const lockedSampleEnd = fullyLocked ? chartW : lockedW - 8;
  const lockedSampleCoords = hasLocked
    ? LOCKED_SAMPLE.map((share, k) => ({
        x: (k / (LOCKED_SAMPLE.length - 1)) * lockedSampleEnd,
        y: chartH * (1 - share),
      }))
    : [];
  const lockedSamplePath = lockedSampleCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const GRID_STEPS = 4;
  const gridValues = Array.from({ length: GRID_STEPS + 1 }, (_, i) =>
    Math.round(domainMin + (domainRange * i) / GRID_STEPS),
  ).reverse();

  const pickNearest = (e: React.PointerEvent<SVGSVGElement>) => {
    if (noValues) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    let closest = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].x - x) < Math.abs(coords[closest].x - x)) {
        closest = i;
      }
    }
    setActiveIndex(closest);
  };

  // The blurred cover over the locked part, as a share of the chart's width.
  const lockedWidthPct = fullyLocked
    ? 100
    : hasLocked
      ? ((lockedW + 4) / w) * 100
      : 0;

  // A point picked on a longer series can be out of range once the data
  // changes (unit switch, refetch).
  const shownIndex =
    activeIndex !== null && activeIndex < displayPoints.length
      ? activeIndex
      : displayPoints.length - 1;
  const shownPoint = displayPoints[shownIndex];
  const formatValue = (v: number) =>
    `${Math.round(v * 10) / 10}${unit ? ` ${unit}` : ""}`;

  const xLabelCount = Math.min(5, displayPoints.length);
  const xLabelIndices =
    xLabelCount === 0
      ? []
      : xLabelCount === 1
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
        {!isEmpty && !fullyLocked && (
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-2xl font-black text-gray-900">
              {formatValue(shownPoint.value)}
            </span>
            <span
              className={`text-xs ${
                activeIndex !== null ? "text-[#c9552c] font-semibold" : "text-gray-500"
              }`}
            >
              {new Date(shownPoint.date).toLocaleDateString(getDateLocale(), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        <div className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto block"
          // Vertical swipes still scroll the page; horizontal ones scrub
          // along the chart.
          style={{ touchAction: "pan-y" }}
          onPointerDown={pickNearest}
          onPointerMove={(e) => {
            // Mouse: follows the hover. Touch/pen: only while pressed.
            if (e.pointerType === "mouse" || e.buttons > 0) pickNearest(e);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActiveIndex(null);
          }}
        >
          {gridValues.map((v, i) => {
            const y = getY(v);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={chartW} y2={y} stroke={gridColor} strokeWidth="1" />
                <text x={chartW + 5} y={y + 3} fontSize="8" fill={textColor}>
                  {noValues ? "—" : v}
                </text>
              </g>
            );
          })}

          {lockedSamplePath && (
            <path
              d={lockedSamplePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {lockedSampleCoords.map((c, i) => (
            <circle
              key={`locked-${i}`}
              cx={c.x}
              cy={c.y}
              r={3}
              fill={lineColor}
              stroke="var(--chart-dot-ring)"
              strokeWidth={1.2}
            />
          ))}

          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activeIndex !== null && coords[activeIndex] && (
            <line
              x1={coords[activeIndex].x}
              y1={0}
              x2={coords[activeIndex].x}
              y2={chartH}
              stroke="var(--chart-guide)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {coords.map((c, i) => {
            const active = i === activeIndex;
            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={active ? 4.5 : 3}
                fill={active ? "var(--chart-dot-ring)" : lineColor}
                stroke={active ? lineColor : "var(--chart-dot-ring)"}
                strokeWidth={active ? 2 : 1.2}
              />
            );
          })}

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
                : new Date(displayPoints[idx].date).toLocaleDateString(
                    getDateLocale(),
                    { day: "numeric", month: "short" },
                  )}
            </text>
          ))}
        </svg>

        {locked && lockedWidthPct > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-xl bg-white/60 backdrop-blur-[3px] flex flex-col items-center justify-center gap-1.5 px-2 text-center"
            style={{ width: `${lockedWidthPct}%` }}
          >
            <button
              onClick={locked.onUnlock}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg active:scale-[0.97] transition-transform"
            >
              <Crown size={13} /> {locked.buttonLabel}
            </button>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#c9552c] leading-tight">
              {locked.label}
            </p>
          </div>
        )}
        </div>

        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <p className="text-sm font-black text-gray-900 text-center">
              {resolvedEmptyTitle}
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
