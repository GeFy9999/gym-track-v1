import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

type MuscleGroupVolume = {
  name: string;
  sets: number;
  percentage: number;
};

const BAR_COLORS = ["#191714", "#c9552c", "#d9835a", "#e6ab8c"];

function getBarColor(index: number) {
  return BAR_COLORS[index] ?? BAR_COLORS[BAR_COLORS.length - 1];
}

// Fixed made-up numbers shown to non-Pro users instead of their real muscle
// volume — a CSS blur alone would still let the real values underneath be
// read (devtools, squinting), defeating the gate.
const DEMO_VOLUMES: MuscleGroupVolume[] = [
  { name: "Chest", sets: 18, percentage: 100 },
  { name: "Dos", sets: 14, percentage: 78 },
  { name: "Legs", sets: 11, percentage: 61 },
  { name: "Épaules", sets: 8, percentage: 44 },
];

export default function MuscleVolume({ isPro }: { isPro: boolean }) {
  const [volumes, setVolumes] = useState<MuscleGroupVolume[]>([]);
  const [loading, setLoading] = useState(isPro);

  useEffect(() => {
    if (!isPro) return;

    const fetchVolume = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/sessions/me/volume`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVolumes(data);
      }
      setLoading(false);
    };
    fetchVolume();
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="bg-[#ece7dd] rounded-2xl p-4 space-y-3.5 shadow-sm">
        {DEMO_VOLUMES.map(({ name, sets, percentage }, i) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide w-20 shrink-0">
              {name}
            </span>
            <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${percentage}%`, background: getBarColor(i) }}
              />
            </div>
            <span className="text-xs font-bold text-gray-900 w-14 text-right">
              {sets} SET{sets === 1 ? "" : "S"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-white/50 rounded mb-2" />
              <div className="h-3 bg-white/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (volumes.length === 0) {
    const placeholders = [
      { name: "Chest", pct: 100 },
      { name: "Dos", pct: 75 },
      { name: "Legs", pct: 60 },
      { name: "Épaules", pct: 45 },
    ];
    return (
      <div className="bg-[#ece7dd] rounded-2xl p-4 space-y-3.5 opacity-60">
        {placeholders.map(({ name, pct }, i) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide w-20 shrink-0">
              {name}
            </span>
            <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: getBarColor(i) }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 w-14 text-right">
              --
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#ece7dd] rounded-2xl p-4 space-y-3.5 shadow-sm">
      {volumes.map(({ name, sets, percentage }, i) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wide w-20 shrink-0">
            {name}
          </span>
          <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, background: getBarColor(i) }}
            />
          </div>
          <span className="text-xs font-bold text-gray-900 w-14 text-right">
            {sets} SET{sets === 1 ? "" : "S"}
          </span>
        </div>
      ))}
    </div>
  );
}
