import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cachedJson } from "../../lib/cachedFetch";
import { offlineAwareFetch } from "../../lib/offlineFetch";
import {
  getLocalOnlySessions,
  saveLocalSession,
} from "../../lib/localSessions";
import { getMuscleGroupLabel } from "../../utils/muscleGroupLabel";
import { hasSetData } from "../../utils/trackingType";
import {
  getFinishedExerciseSessionIds,
  unmarkExercisesFinished,
} from "../../utils/finishedExercises";

type MuscleGroup = {
  id: string;
  name: string;
};

type Props = {
  refreshKey?: number;
  onActiveCountChange?: (count: number) => void;
  onWeekSummaryChange?: (completed: number, total: number) => void;
  /** Group whose exercises were just finished — its check mark pops in. */
  justFinishedGroup?: string | null;
};

export default function MuscleGroupsCards({
  refreshKey,
  onActiveCountChange,
  onWeekSummaryChange,
  justFinishedGroup,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        // Cached, so the groups still show (and open) without signal.
        const { data } = await cachedJson<MuscleGroup[]>("/muscleGroups");
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
        type WeekSession = {
          id: string;
          muscleGroup: string;
          completed: boolean;
          sessionExercises: {
            sets: { weight: number; reps: number; durationSeconds?: number | null }[];
          }[];
        };
        const { data: fromServer } = await cachedJson<WeekSession[]>(
          `/sessions/me?start=${monday.toISOString()}&end=${now.toISOString()}`,
          { cacheKey: "sessions-this-week" },
        );
        // Plus the sessions started offline that haven't synced yet.
        const sessions: WeekSession[] = [
          ...fromServer,
          ...(await getLocalOnlySessions()).filter(
            (s) => new Date(s.date) >= monday,
          ),
        ];

        // Open sessions whose exercises the user already finished show as
        // done here, while still waiting on "Terminer la séance" server-side.
        const finishedIds = getFinishedExerciseSessionIds();
        const isFinishedPending = (s: { id: string; completed: boolean }) =>
          !s.completed && finishedIds.has(s.id);

        const done = new Set(
          sessions
            .filter((s) => s.completed || isFinishedPending(s))
            .map((s) => s.muscleGroup),
        );
        setCompletedGroups(done);

        const inProgress = new Set(
          sessions
            .filter(
              (s) =>
                !s.completed &&
                !isFinishedPending(s) &&
                s.sessionExercises.some((se) =>
                  se.sets.some(hasSetData),
                ),
            )
            .map((s) => s.muscleGroup),
        );
        setActiveGroups(inProgress);
        onActiveCountChange?.(
          sessions.filter(isFinishedPending).length + inProgress.size,
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (groups.length === 0) return;
    onWeekSummaryChange?.(completedGroups.size, groups.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedGroups, groups]);

  const handleClick = async (group: MuscleGroup) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      type OpenSession = { id: string; muscleGroup: string; completed: boolean };
      const fromServer = await cachedJson<OpenSession[]>("/sessions/me", {
        cacheKey: "sessions-all",
      })
        .then((r) => r.data)
        .catch(() => [] as OpenSession[]);
      const sessions = [...fromServer, ...(await getLocalOnlySessions())];
      const existing = sessions.find(
        (s) => s.muscleGroup === group.name && !s.completed,
      );

      if (existing) {
        // Reopening a group marked finished means the user is resuming it.
        unmarkExercisesFinished(existing.id);
        navigate(`/session/${existing.id}`);
        return;
      }

      // Works offline too: the session is created on this device under a
      // temporary id, and on the server once the connection is back.
      const tempId = `temp-${crypto.randomUUID()}`;
      const result = await offlineAwareFetch(
        "POST",
        "/sessions",
        { muscleGroup: group.name },
        "Nouvelle séance",
        { localId: tempId },
      );

      if (result.queued) {
        await saveLocalSession({
          id: tempId,
          muscleGroup: group.name,
          completed: false,
          date: new Date().toISOString(),
          sessionExercises: [],
        });
        navigate(`/session/${tempId}`);
        return;
      }

      if (!result.response.ok) throw new Error("Erreur création session");
      const session = await result.response.json();
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Bring the just-finished group into view so its check animation is seen
  // (the row scrolls horizontally). Only moves the row, never the page.
  useEffect(() => {
    if (!justFinishedGroup || groups.length === 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector<HTMLElement>(
      `[data-group="${CSS.escape(justFinishedGroup)}"]`,
    );
    if (!card) return;
    container.scrollTo({
      left:
        container.scrollLeft +
        card.getBoundingClientRect().left -
        container.getBoundingClientRect().left -
        (container.clientWidth - card.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [justFinishedGroup, groups]);

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
    <div className="mt-7">
      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 px-5">
        {t("dashboard.muscleGroups")}
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
              data-group={group.name}
              onClick={() => handleClick(group)}
              className={`relative flex-shrink-0 w-36 rounded-2xl pt-6 pb-3 flex flex-col items-center transition-all shadow-sm ${
                isActive
                  ? "bg-[#ece7dd] border-2 border-[#c9552c] active:scale-[0.97]"
                  : "bg-[#ece7dd] active:scale-[0.97]"
              }`}
            >
              {isDone && (
                <div className="absolute top-2.5 right-2.5 w-6 h-6">
                  {group.name === justFinishedGroup && (
                    <div className="absolute inset-0 rounded-full bg-[#3a9e6e] animate-set-check-ring [animation-delay:350ms]" />
                  )}
                  <div
                    className={`relative w-6 h-6 rounded-full bg-[#3a9e6e] flex items-center justify-center ${
                      group.name === justFinishedGroup
                        ? "animate-set-check-pop [animation-delay:350ms]"
                        : ""
                    }`}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-[#c9552c] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t("dashboard.inProgress")}
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

              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide text-center px-2">
                {getMuscleGroupLabel(group.name, t)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
