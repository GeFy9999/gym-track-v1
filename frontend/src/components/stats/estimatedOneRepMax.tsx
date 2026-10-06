import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Trophy } from "lucide-react";
import { getWeightUnit } from "../../utils/units";
import { API_URL } from "../../lib/api";

type TrackedExercise = { id: string; exerciseId: string };
type RecordEntry = { name: string; weight: number; exerciseId: string };
type ProgressPoint = { week: string; oneRepMax: number };
type ExerciseOneRM = { exerciseId: string; name: string; points: ProgressPoint[] };

// Fixed made-up numbers shown to non-Pro users instead of their real 1RM
// progress — a CSS blur alone would still let the real values underneath be
// read (devtools, squinting), defeating the gate.
function buildDemoData(translate: (key: string) => string): ExerciseOneRM[] {
  const today = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const points = (base: number, step: number): ProgressPoint[] =>
    [4, 3, 2, 1, 0].map((weeksAgo, i) => ({
      week: new Date(today - weeksAgo * week).toISOString(),
      oneRepMax: base + i * step,
    }));

  return [
    { exerciseId: "demo-1", name: translate("common.exercise"), points: points(225, 6) },
    { exerciseId: "demo-2", name: translate("common.exercise"), points: points(145, 4) },
  ];
}

export default function EstimatedOneRepMax({ isPro }: { isPro: boolean }) {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ExerciseOneRM[]>([]);
  const [loading, setLoading] = useState(isPro);

  useEffect(() => {
    if (!isPro) return;

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
  }, [isPro]);

  const withData = isPro
    ? data.filter((ex) => ex.points.length > 0)
    : buildDemoData(translate);

  if (!isPro) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {withData.map((ex) => (
          <OneRepMaxCard key={ex.exerciseId} name={ex.name} points={ex.points} />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
            <div className="h-3 w-20 bg-gray-300/50 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-300/50 rounded mb-2" />
            <div className="h-3 w-10 bg-gray-300/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

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
        <OneRepMaxCard
          key={ex.exerciseId}
          name={ex.name}
          points={ex.points}
          // The full 1RM chart lives on the exercise's detail page.
          onClick={() => navigate(`/exercise/${ex.exerciseId}`)}
        />
      ))}
    </div>
  );
}

// Current estimated 1RM and its change. No chart here — the exercise's
// detail page (where the card leads) has the full, much better one.
function OneRepMaxCard({
  name,
  points,
  onClick,
}: {
  name: string;
  points: ProgressPoint[];
  onClick?: () => void;
}) {
  const unit = getWeightUnit();
  const current = points[points.length - 1].oneRepMax;
  const diff = Math.round((current - points[0].oneRepMax) * 10) / 10;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="relative w-full text-left bg-[#ece7dd] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform disabled:active:scale-100"
    >
      {onClick && (
        <ChevronRight size={16} className="absolute top-4 right-3 text-gray-400" />
      )}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 truncate pr-4">
        {name}
      </p>
      <p className="text-lg font-black text-[#c9552c]">
        {Math.round(current)} {unit}
      </p>
      {points.length >= 2 && (
        <p
          className={`text-[11px] font-semibold ${
            diff > 0 ? "text-[#c9552c]" : "text-gray-400"
          }`}
        >
          {diff > 0 ? "↑" : diff < 0 ? "↓" : "–"} {Math.abs(diff)} {unit}
        </p>
      )}
    </button>
  );
}
