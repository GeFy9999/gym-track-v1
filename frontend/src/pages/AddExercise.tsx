import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Check, ChevronDown } from "lucide-react";

import { API_URL } from "../lib/api";

type Exercise = {
  id: string;
  name: string;
  image: string | null;
  muscleGroup: { id: string; name: string };
};

type TrackedExercise = {
  id: string;
  exerciseId: string;
};

export default function AddExercisePage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [tracked, setTracked] = useState<TrackedExercise[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [visiblePerGroup, setVisiblePerGroup] = useState<{
    [key: string]: number;
  }>({});
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisiblePerGroup((prev) => {
          const updated = { ...prev };
          for (const group of openGroups) {
            updated[group] = (updated[group] || 20) + 20;
          }
          return updated;
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openGroups]);

  useEffect(() => {
    if (search) {
      setOpenGroups(Object.keys(grouped));
    } else {
      setOpenGroups([]);
    }
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [exRes, trRes] = await Promise.all([
        fetch(`${API_URL}/exercises`),
        fetch(`${API_URL}/tracked-exercises`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (exRes.ok) setExercises(await exRes.json());
      if (trRes.ok) setTracked(await trRes.json());
      setLoading(false);
    };
    fetchData();
  }, []);

  const isTracked = (exerciseId: string) =>
    tracked.some((t) => t.exerciseId === exerciseId);

  const handleToggle = async (exerciseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const existing = tracked.find((t) => t.exerciseId === exerciseId);

    if (existing) {
      await fetch(`${API_URL}/tracked-exercises/${existing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTracked(tracked.filter((t) => t.id !== existing.id));
    } else {
      const res = await fetch(`${API_URL}/tracked-exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exerciseId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTracked([...tracked, data]);
      }
    }
  };

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped: { [group: string]: Exercise[] } = {};
  for (const ex of filtered) {
    const group = ex.muscleGroup.name;
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(ex);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 pb-8">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Records personnels</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Choisis les exercices à suivre dans tes stats
          </p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un exercice..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {Object.entries(grouped).map(([group, groupExercises]) => {
          const isOpen = openGroups.includes(group);
          const trackedCount = groupExercises.filter((ex) =>
            isTracked(ex.id),
          ).length;
          const limit = visiblePerGroup[group] || 20;
          const visible = isOpen ? groupExercises.slice(0, limit) : [];
          const hasMore = isOpen && groupExercises.length > limit;

          return (
            <div
              key={group}
              className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {group}
                  </span>
                  {trackedCount > 0 && (
                    <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">
                      {trackedCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={18}
                  className={`text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-zinc-700 px-3 py-2 space-y-1">
                  {visible.map((ex) => {
                    const active = isTracked(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => handleToggle(ex.id)}
                        className="w-full flex items-center gap-3 bg-zinc-700/30 hover:bg-zinc-700 rounded-lg px-3 py-2.5 transition-colors"
                      >
                        {ex.image && (
                          <img
                            src={ex.image}
                            alt={ex.name}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-700 flex-shrink-0"
                          />
                        )}
                        <span className="flex-1 text-left text-sm text-zinc-200">
                          {ex.name}
                        </span>
                        {active ? (
                          <Check size={18} className="text-orange-400" />
                        ) : (
                          <Plus size={18} className="text-zinc-600" />
                        )}
                      </button>
                    );
                  })}
                  {hasMore && (
                    <p className="text-xs text-zinc-500 text-center py-2">
                      Scroll pour voir plus...
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
