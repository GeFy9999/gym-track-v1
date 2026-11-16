import { useEffect, useRef } from "react";

const ITEM_HEIGHT = 52;

type WheelPickerProps = {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
};

// A scroll-snapping column: one value per row, the centred row is the
// picked one. Native scrolling, so it flicks with momentum on phones.
export default function WheelPicker({
  values,
  value,
  onChange,
  label,
  className = "w-20",
}: WheelPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  // Bring the current value to the centre — on mount, and when the value
  // changes from outside (not while the user is the one scrolling).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const index = values.indexOf(value);
    if (index < 0) return;
    const target = index * ITEM_HEIGHT;
    if (Math.abs(list.scrollTop - target) > ITEM_HEIGHT / 2) {
      list.scrollTop = target;
    }
  }, [value, values]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const handleScroll = () => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const list = listRef.current;
      if (!list) return;
      const index = Math.min(
        values.length - 1,
        Math.max(0, Math.round(list.scrollTop / ITEM_HEIGHT)),
      );
      if (values[index] !== value) onChange(values[index]);
    }, 80);
  };

  const step = (delta: number) => {
    const index = values.indexOf(value);
    const next = values[index + delta];
    if (next !== undefined) onChange(next);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Lines framing the picked row */}
      <div
        className="pointer-events-none absolute inset-x-0 border-y-2 border-[#c9552c]"
        style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        ref={listRef}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        onScroll={handleScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            step(-1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            step(1);
          }
        }}
        className="overflow-y-scroll snap-y snap-mandatory hide-scrollbar focus:outline-none"
        style={{
          height: ITEM_HEIGHT * 3,
          paddingBlock: ITEM_HEIGHT,
          maskImage:
            "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      >
        {values.map((v) => (
          <button
            key={v}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(v)}
            className={`w-full snap-center flex items-center justify-center text-3xl font-black transition-colors ${
              v === value ? "text-gray-900" : "text-gray-400"
            }`}
            style={{ height: ITEM_HEIGHT }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
