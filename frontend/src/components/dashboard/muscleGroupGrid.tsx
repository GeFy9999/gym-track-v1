import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { API_URL } from "../../lib/api";

type MuscleGroup = {
  id: string;
  name: string;
};

type Props = {
  weekActive: boolean;
};

export default function MuscleGroupsCards({ weekActive }: Props) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<MuscleGroup[]>([]);
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${API_URL}/muscleGroups`);
        if (!res.ok) throw new Error("Erreur fetch muscleGroups");
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!weekActive) return;

    const fetchCompleted = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      try {
        const res = await fetch(
          `${API_URL}/sessions/me?start=${monday.toISOString()}&end=${now.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const sessions: { muscleGroup: string; completed: boolean }[] =
          await res.json();

        const done = new Set(
          sessions.filter((s) => s.completed).map((s) => s.muscleGroup),
        );
        setCompletedGroups(done);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompleted();
  }, [weekActive]);

  const handleClick = async (group: MuscleGroup) => {
    if (!weekActive) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const res = await fetch(
        `${API_URL}/sessions/me?start=${todayStart.toISOString()}&end=${new Date().toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const sessions = await res.json();
        const existing = sessions.find(
          (s: { muscleGroup: string; completed: boolean }) =>
            s.muscleGroup === group.name && !s.completed,
        );

        if (existing) {
          navigate(`/session/${existing.id}`);
          return;
        }
      }

      const stored = localStorage.getItem("user");
      if (!stored) return;
      const user = JSON.parse(stored);

      const createRes = await fetch(`${API_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          muscleGroup: group.name,
        }),
      });

      if (!createRes.ok) throw new Error("Erreur création session");
      const session = await createRes.json();
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="px-5 mt-6">
        <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-[15px] font-bold text-gray-900 mb-3 px-5">
        Groupes musculaires
      </p>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-2">
        {groups.map((group) => {
          const isDone = completedGroups.has(group.name);

          return (
            <button
              key={group.id}
              onClick={() => handleClick(group)}
              disabled={!weekActive}
              className={`relative flex-shrink-0 w-32 rounded-2xl pt-3 pb-3 flex flex-col items-center transition-all ${
                weekActive
                  ? "bg-white border border-gray-200 shadow-sm active:scale-[0.97]"
                  : "bg-white/60 border border-gray-100 opacity-50"
              }`}
            >
              {isDone && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3a9e6e] flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}

              <div className="w-18 h-22 rounded-lg bg-gray-100 mb-2 flex items-center justify-center">
                <span className="text-3xl text-gray-300">🏋️</span>
              </div>

              <span className="text-xs font-medium text-gray-700 text-center px-1">
                {group.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
