import { useEffect, useState } from "react";
import { getWeightUnit } from "../../utils/units";
import { API_URL } from "../../lib/api";

type Record = {
  name: string;
  weight: number;
  exerciseId: string;
};

export default function PersonalRecordCards() {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/sessions/me/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    };
    fetchRecords();
  }, []);

  if (records.length === 0) {
    const placeholders = ["Bench Press", "Squat", "Deadlift", "Rowing"];
    return (
      <div className="grid grid-cols-2 gap-4">
        {placeholders.map((name) => (
          <div
            key={name}
            className="bg-zinc-800/50 border border-dashed border-zinc-700 rounded-xl p-4 flex flex-col justify-between"
          >
            <p className="text-xs text-zinc-600 mb-1">{name}</p>
            <p className="text-lg font-semibold text-zinc-700">
              -- {getWeightUnit()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {records.map(({ name, weight }) => (
        <div
          key={name}
          className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex flex-col justify-between"
        >
          <p className="text-xs text-zinc-400 mb-1">{name}</p>
          <p className="text-lg font-semibold text-orange-400">
            {Math.round(weight * 10) / 10} {getWeightUnit()}
          </p>
        </div>
      ))}
    </div>
  );
}
