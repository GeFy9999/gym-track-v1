import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getWeightUnit } from "../../utils/units";
import { API_URL } from "../../lib/api";

type Record = {
  name: string;
  weight: number;
  exerciseId: string;
};

export default function PersonalRecordCards() {
  const navigate = useNavigate();
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
          <div key={i} className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
            <div className="h-3 w-20 bg-gray-300/50 rounded mb-3" />
            <div className="h-5 w-16 bg-gray-300/50 rounded" />
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
          <div key={name} className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              {name}
            </p>
            <div className="flex items-baseline gap-1.5">
              <div className="h-2.5 w-14 rounded-full bg-gray-400/40" />
              <span className="text-xs font-bold text-gray-400 uppercase">
                {getWeightUnit()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {records.map(({ name, weight, exerciseId }) => (
        // Opens the exercise's detail page (history, records by reps, charts).
        <button
          key={exerciseId}
          type="button"
          onClick={() => navigate(`/exercise/${exerciseId}`)}
          className="relative w-full text-left bg-[#ece7dd] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <ChevronRight size={16} className="absolute top-4 right-3 text-gray-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 pr-4">
            {name}
          </p>
          <p className="text-lg font-black text-[#c9552c]">
            {Math.round(weight)} {getWeightUnit()}
          </p>
        </button>
      ))}
    </div>
  );
}
