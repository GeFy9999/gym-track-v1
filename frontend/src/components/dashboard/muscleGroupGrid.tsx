import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const muscleImages: { [key: string]: string } = {
    Abdominaux: "/imgAbs-Photoroom.webp",
    "Avant-bras": "/imgAvantBras-Photoroom.webp",
    Biceps: "/imgBiceps-Photoroom.webp",
    Dos: "/imgDos-Photoroom.webp",
    Épaules: "/imgEpaules-Photoroom.webp",
    Epaules: "/imgEpaules-Photoroom.webp",
    Legs: "/imgLegs-Photoroom.webp",
    Chest: "/imgPec3.png",
    Pectoraux: "/imgPec3.png",
    Trapèze: "/imgTrapeze-Photoroom.webp",
    Trapeze: "/imgTrapeze-Photoroom.webp",
    Triceps: "/imgTriceps-Photoroom.webp",
  };

  const imageScale: { [key: string]: string } = {
    Chest: "scale-[1.15]",
    Pectoraux: "scale-[1.15]",
  };

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
        const sessions: {
          muscleGroup: string;
          completed: boolean;
          sessionExercises: {
            sets: { weight: number; reps: number }[];
          }[];
        }[] = await res.json();

        const done = new Set(
          sessions.filter((s) => s.completed).map((s) => s.muscleGroup),
        );
        setCompletedGroups(done);

        const inProgress = new Set(
          sessions
            .filter(
              (s) =>
                !s.completed &&
                s.sessionExercises.some((se) =>
                  se.sets.some((set) => set.weight > 0 || set.reps > 0),
                ),
            )
            .map((s) => s.muscleGroup),
        );
        setActiveGroups(inProgress);
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (loading) {
    return (
      <div className="mt-6">
        <div className="h-4 w-36 bg-gray-200 rounded mb-3 mx-5 animate-pulse" />
        <div className="flex gap-3 px-5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 h-40 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-[15px] font-bold text-gray-900 mb-3 px-5">
        Groupes musculaires
      </p>
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pt-4 pb-2 cursor-grab active:cursor-grabbing select-none"
      >
        {groups.map((group) => {
          const isDone = completedGroups.has(group.name);
          const isActive = activeGroups.has(group.name) && !isDone;

          return (
            <button
              key={group.id}
              onClick={() => handleClick(group)}
              disabled={!weekActive}
              className={`relative flex-shrink-0 w-36 rounded-2xl pt-6 pb-3 flex flex-col items-center transition-all ${
                weekActive
                  ? isActive
                    ? "bg-white border-2 border-[#c9552c] shadow-sm active:scale-[0.97]"
                    : "bg-white border border-gray-200 shadow-sm active:scale-[0.97]"
                  : "bg-white/60 border border-gray-100 opacity-50"
              }`}
            >
              {isDone && (
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#3a9e6e] flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-[#c9552c] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  En cours
                </div>
              )}

              <div className="w-20 h-24 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {muscleImages[group.name] ? (
                  <img
                    src={muscleImages[group.name]}
                    alt={group.name}
                    className={`w-full h-full object-contain ${imageScale[group.name] || ""}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl text-gray-300">🏋️</span>
                  </div>
                )}
              </div>

              <span className="text-sm font-semibold text-gray-700 text-center px-2">
                {group.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
