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
      <div className="min-h-screen bg-[#faf6f1] pb-28 px-5">
        <div className="pt-6 pb-4 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="h-7 w-48 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-full bg-gray-200 rounded-2xl mb-4" />
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="h-10 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-28">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center active:bg-gray-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-[26px] font-black text-gray-900 leading-tight">
            Records personnels
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Choisis les exercices à suivre dans tes stats
          </p>
        </div>
      </div>

      <div className="px-5 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un exercice..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c9552c] transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="px-5 space-y-2">
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
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
                trackedCount > 0 ? "border-[#c9552c]/30" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2.5">
                  {trackedCount > 0 && (
                    <div className="w-2 h-2 rounded-full bg-[#c9552c]" />
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {group}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-3 py-2 space-y-1">
                  {visible.map((ex) => {
                    const active = isTracked(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => handleToggle(ex.id)}
                        className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <span className="flex-1 text-left text-sm text-gray-700">
                          {ex.name}
                        </span>
                        {active ? (
                          <div className="w-8 h-8 rounded-full bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-[#c9552c]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-[#c9552c]/40 flex items-center justify-center flex-shrink-0">
                            <Plus size={14} className="text-[#c9552c]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {hasMore && (
                    <p className="text-xs text-gray-400 text-center py-2">
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
