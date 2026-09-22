import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Dumbbell, Trophy, ChevronDown } from "lucide-react";
import { API_URL } from "../lib/api";
import { useTrackedExercises } from "../hooks/useTrackedExercises";

type Exercise = {
  id: string;
  name: string;
  image: string | null;
  muscleGroup: { id: string; name: string };
};

type MuscleGroup = { id: string; name: string };

type ExerciseStat = { exerciseId: string; sessionCount: number; lastDate: string };

const PAGE_SIZE = 20;

export default function ExercisesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isTracked, fetchTracked, toggleTracked, tracked } = useTrackedExercises();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [stats, setStats] = useState<Record<string, ExerciseStat>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    () => (location.state as { group?: string } | null)?.group ?? null,
  );
  const [trackedOpen, setTrackedOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [poppingId, setPoppingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      try {
        const [exRes, mgRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/exercises`),
          fetch(`${API_URL}/muscleGroups`),
          fetch(`${API_URL}/sessions/me/exercise-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (exRes.ok) setExercises(await exRes.json());
        if (mgRes.ok) setMuscleGroups(await mgRes.json());
        if (statsRes.ok) {
          const statsList: ExerciseStat[] = await statsRes.json();
          const map: Record<string, ExerciseStat> = {};
          for (const s of statsList) map[s.exerciseId] = s;
          setStats(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchTracked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisibleCount((prev) => prev + PAGE_SIZE);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedGroup]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (selectedGroup && e.muscleGroup.name !== selectedGroup) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [exercises, selectedGroup, search]);

  const trackedExercises = useMemo(
    () => exercises.filter((e) => isTracked(e.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, tracked],
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const renderCard = (ex: Exercise) => {
    const stat = stats[ex.id];
    const tracked = isTracked(ex.id);
    return (
      <button
        key={ex.id}
        onClick={() => navigate(`/exercise/${ex.id}`)}
        className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 shadow-sm active:scale-[0.99] transition-all ${
          tracked ? "" : "bg-[#ece7dd]"
        }`}
        style={tracked ? { background: "#191714" } : undefined}
      >
        {ex.image ? (
          <img
            src={ex.image}
            alt=""
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tracked ? "bg-white/10" : "bg-white/60"
            }`}
          >
            <Dumbbell
              size={18}
              className={tracked ? "text-white/40" : "text-gray-400"}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 text-left">
          <p
            className={`text-sm font-bold uppercase truncate ${
              tracked ? "text-white" : "text-gray-900"
            }`}
          >
            {ex.name}
          </p>
          <p
            className={`text-xs font-bold uppercase ${
              tracked ? "text-[#c9552c]" : "text-[#c9552c]/80"
            }`}
          >
            {ex.muscleGroup.name}
            {tracked ? ` · ${t("exercises.trackedSuffix")}` : ""}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {stat && stat.sessionCount > 0 && (
            <span className="text-[11px] font-semibold text-[#c9552c]">
              {stat.sessionCount} {t("exercises.session", { count: stat.sessionCount })}
            </span>
          )}
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleTracked(ex.id);
              setPoppingId(ex.id);
            }}
            onAnimationEnd={() =>
              setPoppingId((current) => (current === ex.id ? null : current))
            }
            role="button"
            aria-label={t("exercises.trackAria")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              tracked ? "bg-[#c9552c] text-white" : "bg-white text-gray-400"
            }`}
          >
            <Trophy
              size={15}
              className={poppingId === ex.id ? "animate-trophy-pop" : ""}
            />
          </span>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] pb-28">
        <div className="px-5 pt-8 pb-6 animate-pulse" style={{ background: "#191714" }}>
          <div className="h-7 w-40 bg-white/10 rounded mb-2" />
          <div className="h-3 w-56 bg-white/10 rounded mb-4" />
          <div className="h-11 w-full bg-white/10 rounded-full" />
        </div>
        <div className="px-5 pt-4 space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-[#ece7dd] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-28">
      <div className="px-5 pt-8 pb-6" style={{ background: "#191714" }}>
        <h1 className="text-[26px] font-black text-white uppercase tracking-wide leading-tight">
          {t("exercises.title")}
        </h1>
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1 mb-4">
          {t("exercises.subtitle")}
        </p>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("exercises.searchPlaceholder")}
            className="w-full bg-white/10 rounded-full pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mt-4 mb-4 pl-5 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 pr-5 w-max">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`flex-shrink-0 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-colors shadow-sm ${
              selectedGroup === null
                ? "bg-[#191714] text-white"
                : "bg-[#ece7dd] text-gray-700"
            }`}
          >
            {t("exercises.all")}
          </button>
          {muscleGroups.map((mg) => (
            <button
              key={mg.id}
              onClick={() => setSelectedGroup(mg.name)}
              className={`flex-shrink-0 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full transition-colors shadow-sm ${
                selectedGroup === mg.name
                  ? "bg-[#191714] text-white"
                  : "bg-[#ece7dd] text-gray-700"
              }`}
            >
              {mg.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {trackedExercises.length > 0 && (
          <div>
            <button
              onClick={() => setTrackedOpen((v) => !v)}
              className="w-full flex items-center justify-between mb-2 px-1"
            >
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {t("exercises.tracked")}{" "}
                <span className="text-gray-400">
                  ({trackedExercises.length})
                </span>
              </p>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${
                  trackedOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {trackedOpen && (
              <div className="space-y-2">
                {trackedExercises.map((ex) => renderCard(ex))}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              {t("exercises.allExercises")}
            </p>
            <span className="text-xs font-bold text-[#c9552c]">
              {filtered.length}
            </span>
          </div>
          <div className="space-y-2">
            {visible.map((ex) => renderCard(ex))}
            {visible.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                {t("exercises.noneFound")}
              </p>
            )}
            {hasMore && (
              <p className="text-xs text-gray-400 text-center py-3">
                {t("exercises.scrollForMore")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
