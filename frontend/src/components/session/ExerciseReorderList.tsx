import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import type { SessionExercise } from "../../types/session";

type Props = {
  exercises: SessionExercise[];
  onReorderLive: (next: SessionExercise[]) => void;
  onDrop: (order: string[]) => void;
};

// Fully self-contained drag-and-drop reorder list. Owns all pointer/animation
// mechanics internally and only reports the resulting order upward — the
// parent never needs to know how the dragging itself works.
export default function ExerciseReorderList({
  exercises,
  onReorderLive,
  onDrop,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragRect, setDragRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const exercisesRef = useRef(exercises);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevRowTops = useRef<Record<string, number>>({});

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  // iOS-style reorder animation: capture each row's position before the
  // list re-renders, then invert + animate to the new position so the
  // other rows visibly slide out of the way instead of snapping instantly.
  const captureRowPositions = (skipId: string) => {
    const positions: Record<string, number> = {};
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (el && id !== skipId) positions[id] = el.getBoundingClientRect().top;
    }
    prevRowTops.current = positions;
  };

  const playReorderAnimation = (skipId: string) => {
    for (const [id, el] of Object.entries(rowRefs.current)) {
      if (!el || id === skipId) continue;
      const prevTop = prevRowTops.current[id];
      if (prevTop === undefined) continue;
      const newTop = el.getBoundingClientRect().top;
      const delta = prevTop - newTop;
      if (delta === 0) continue;

      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect(); // force reflow before animating
      requestAnimationFrame(() => {
        el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
        const cleanup = () => {
          el.style.transition = "";
          el.removeEventListener("transitionend", cleanup);
        };
        el.addEventListener("transitionend", cleanup);
      });
    }
  };

  const handleDragStart = (
    e: React.PointerEvent<HTMLButtonElement>,
    draggedId: string,
  ) => {
    const cardEl = rowRefs.current[draggedId];
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();

    setDraggingId(draggedId);
    setDragRect({ left: rect.left, width: rect.width });
    setDragOffsetY(e.clientY - rect.top);
    setDragCurrentY(e.clientY);

    const handleMove = (e: PointerEvent) => {
      setDragCurrentY(e.clientY);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cardEl = el?.closest<HTMLElement>("[data-se-id]");
      const overId = cardEl?.dataset.seId;
      if (!overId || overId === draggedId) return;

      const list = [...exercisesRef.current];
      const fromIndex = list.findIndex((s) => s.id === draggedId);
      const toIndex = list.findIndex((s) => s.id === overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      captureRowPositions(draggedId);
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      exercisesRef.current = list;
      onReorderLive(list);
      requestAnimationFrame(() => playReorderAnimation(draggedId));
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setDraggingId(null);
      setDragRect(null);
      const order = exercisesRef.current.map((s) => s.id);
      if (order.length > 0) onDrop(order);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <>
      <div className="space-y-2">
        {exercises.map((se) => {
          const isDragging = draggingId === se.id;
          return (
            <div
              key={se.id}
              data-se-id={se.id}
              ref={(el) => {
                rowRefs.current[se.id] = el;
              }}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                isDragging
                  ? "border-2 border-dashed border-gray-300 bg-gray-100/70"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  handleDragStart(e, se.id);
                }}
                style={{ touchAction: "none" }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none ${
                  isDragging ? "invisible" : "bg-gray-100"
                }`}
                aria-label="Réordonner l'exercice"
              >
                <GripVertical size={18} />
              </button>
              <span
                className={`flex-1 text-sm font-semibold ${
                  isDragging ? "text-transparent" : "text-gray-900"
                }`}
              >
                {se.exercise.name}
              </span>
            </div>
          );
        })}
      </div>

      {draggingId && dragRect && (
        <div
          className="fixed z-50 flex items-center gap-3 bg-white border border-[#c9552c]/40 rounded-2xl px-4 py-3.5 shadow-2xl scale-[1.04] pointer-events-none"
          style={{
            top: dragCurrentY - dragOffsetY,
            left: dragRect.left,
            width: dragRect.width,
          }}
        >
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
            <GripVertical size={18} />
          </div>
          <span className="flex-1 text-sm font-semibold text-gray-900">
            {exercises.find((s) => s.id === draggingId)?.exercise.name}
          </span>
        </div>
      )}
    </>
  );
}
