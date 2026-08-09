import { useNavigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

const colors = [
  "bg-blue-500/15 text-blue-400",
  "bg-red-500/15 text-red-400",
  "bg-amber-500/15 text-amber-400",
  "bg-purple-500/15 text-purple-400",
  "bg-pink-500/15 text-pink-400",
  "bg-green-500/15 text-green-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-orange-500/15 text-orange-400",
  "bg-teal-500/15 text-teal-400",
];

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

  const handleClick = async (group: MuscleGroup) => {
    if (!weekActive) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Check if an active session already exists for this muscle group TODAY
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

      // No active session today — create one
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
      <div className="px-4">
        <p className="text-sm text-zinc-500 text-center py-8">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="px-4">
      <p className="text-base font-semibold text-white mb-4 px-4">
        Groupes musculaires
      </p>
      <div className="grid grid-cols-2 gap-4">
        {groups.map((group, index) => {
          const color = colors[index % colors.length];

          return (
            <button
              key={group.id}
              onClick={() => handleClick(group)}
              disabled={!weekActive}
              className={`rounded-xl p-4 flex items-center gap-3 transition-colors text-left ${
                weekActive
                  ? "bg-zinc-800 border border-zinc-700 hover:border-orange-500/50 cursor-pointer"
                  : "bg-zinc-800/40 border border-zinc-800 opacity-50 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}
              >
                <Dumbbell size={18} />
              </div>
              <span className="font-medium text-sm text-zinc-200">
                {group.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
