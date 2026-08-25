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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

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
      setLoading(false);
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

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
          <p className="text-lg font-bold text-[#c9552c]">
            {Math.round(weight)} {getWeightUnit()}
          </p>
        </div>
      ))}
    </div>
  );
}
