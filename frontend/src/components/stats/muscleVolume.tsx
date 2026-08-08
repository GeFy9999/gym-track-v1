import { useEffect, useState } from "react";

const API_URL = "/api";

type MuscleGroupVolume = {
  name: string;
  sets: number;
  percentage: number;
};

export default function MuscleVolume() {
  const [volumes, setVolumes] = useState<MuscleGroupVolume[]>([]);

  useEffect(() => {
    const fetchVolume = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/sessions/me/volume`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setVolumes(data);
      }
    };
    fetchVolume();
  }, []);

  if (volumes.length === 0) {
    const placeholders = [
      { name: "Chest", pct: 100 },
      { name: "Dos", pct: 75 },
      { name: "Legs", pct: 60 },
      { name: "Épaules", pct: 45 },
    ];
    return (
      <div className="space-y-3 opacity-40">
        {placeholders.map(({ name, pct }) => (
          <div key={name} className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 w-24 shrink-0">{name}</span>
            <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-zinc-600 w-12 text-right">--</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {volumes.map(({ name, sets, percentage }) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 w-24 shrink-0">{name}</span>
          <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-12 text-right">
            {sets} sets
          </span>
        </div>
      ))}
    </div>
  );
}
