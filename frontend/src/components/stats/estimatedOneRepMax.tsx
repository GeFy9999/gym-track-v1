import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { getWeightUnit } from "../../utils/units";
import { API_URL } from "../../lib/api";

type TrackedExercise = { id: string; exerciseId: string };
type RecordEntry = { name: string; weight: number; exerciseId: string };
type ProgressPoint = { week: string; oneRepMax: number };
type ExerciseOneRM = { exerciseId: string; name: string; points: ProgressPoint[] };

export default function EstimatedOneRepMax() {
  const { t: translate } = useTranslation();
  const [data, setData] = useState<ExerciseOneRM[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [trRes, recRes] = await Promise.all([
          fetch(`${API_URL}/tracked-exercises`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/sessions/me/records`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!trRes.ok || !recRes.ok) {
          setLoading(false);
          return;
        }

        const tracked: TrackedExercise[] = await trRes.json();
        const records: RecordEntry[] = await recRes.json();
        const nameById = new Map(records.map((r) => [r.exerciseId, r.name]));

        const results = await Promise.all(
          tracked.map(async (t) => {
            const res = await fetch(
              `${API_URL}/sessions/me/progress/${t.exerciseId}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const points: ProgressPoint[] = res.ok ? await res.json() : [];
            return {
              exerciseId: t.exerciseId,
              name: nameById.get(t.exerciseId) ?? translate("common.exercise"),
              points,
            };
          }),
        );

        setData(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
            <div className="h-3 w-20 bg-gray-300/50 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-300/50 rounded mb-3" />
            <div className="h-8 bg-gray-300/30 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const withData = data.filter((ex) => ex.points.length > 0);

  if (withData.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-3xl p-7 text-center">
        <Trophy size={26} strokeWidth={2} className="text-[#c9552c] mx-auto mb-3" />
        <p className="text-sm text-gray-500 leading-relaxed">
          {translate("stats.oneRepMaxEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {withData.map((ex) => (
        <OneRepMaxCard key={ex.exerciseId} name={ex.name} points={ex.points} />
      ))}
    </div>
  );
}

function OneRepMaxCard({
  name,
  points,
}: {
  name: string;
  points: ProgressPoint[];
}) {
  const unit = getWeightUnit();
  const current = points[points.length - 1].oneRepMax;
  const diff = Math.round((current - points[0].oneRepMax) * 10) / 10;

  const w = 100;
  const h = 32;
  const values = points.map((p) => p.oneRepMax);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const getX = (i: number) =>
    points.length === 1 ? w / 2 : (i / (points.length - 1)) * w;
  const getY = (v: number) => h - ((v - minVal) / range) * h * 0.8 - h * 0.1;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.oneRepMax)}`)
    .join(" ");

  return (
    <div className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 truncate">
        {name}
      </p>
      <p className="text-lg font-black text-[#c9552c]">
        {Math.round(current)} {unit}
      </p>
      {points.length >= 2 && (
        <>
          <p
            className={`text-[11px] font-semibold mb-1 ${
              diff > 0 ? "text-[#c9552c]" : "text-gray-400"
            }`}
          >
            {diff > 0 ? "↑" : diff < 0 ? "↓" : "–"} {Math.abs(diff)} {unit}
          </p>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-8 mt-1"
            preserveAspectRatio="none"
          >
            <path d={linePath} fill="none" stroke="#c9552c" strokeWidth="2" />
          </svg>
        </>
      )}
    </div>
  );
}
