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

      const [recRes, trRes] = await Promise.all([
        fetch(`${API_URL}/sessions/me/records`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/tracked-exercises`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (recRes.ok && trRes.ok) {
        const allRecords = await recRes.json();
        const tracked = await trRes.json();
        const trackedIds = tracked.map(
          (t: { exerciseId: string }) => t.exerciseId,
        );

        setRecords(
          allRecords.filter((r: Record) => trackedIds.includes(r.exerciseId)),
        );
      }
    };
    fetchRecords();
  }, []);

  if (records.length === 0) {
    const placeholders = ["Bench Press", "Squat", "Deadlift", "Rowing"];
    return (
      <div className="grid grid-cols-2 gap-3">
        {placeholders.map((name) => (
          <div
            key={name}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500 mb-1">{name}</p>
            <p className="text-lg font-bold text-gray-800">
              -- {getWeightUnit()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {records.map(({ name, weight }) => (
        <div
          key={name}
          className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-gray-500 mb-1">{name}</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(weight)} {getWeightUnit()}
          </p>
        </div>
      ))}
    </div>
  );
}
