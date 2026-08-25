import { useState, useEffect, useCallback, useRef } from "react";

type TourStep = {
  title: string;
  description: string;
  refIndex?: number;
  selector?: string;
  tooltipPosition?: "above" | "below";
};

type Props = {
  tourKey: string;
  steps: TourStep[];
  refs?: React.RefObject<HTMLDivElement | null>[];
};

export default function TourOverlay({ tourKey, steps, refs }: Props) {
  const storageKey = `tour_${tourKey}`;
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const done = localStorage.getItem(storageKey);
    if (!done) {
      setTimeout(() => setStep(0), 400);
    }
  }, [storageKey]);

  const updateRect = useCallback(() => {
    if (step === null) return;
    const s = steps[step];
    let el: HTMLElement | null = null;

    if (s.selector) {
      el = document.querySelector(s.selector);
    } else if (s.refIndex !== undefined && refs) {
      el = refs[s.refIndex]?.current;
    }

    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [step, steps, refs]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [step, updateRect]);

  const next = () => {
    if (step === null) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setStep(null);
      localStorage.setItem(storageKey, "true");
    }
  };

  const skip = () => {
    setStep(null);
    localStorage.setItem(storageKey, "true");
  };

  if (step === null || !rect) return null;

  const forceAbove = steps[step].tooltipPosition === "above";
  const tooltipTop = forceAbove
    ? Math.max(16, rect.top - 230)
    : Math.min(rect.top + rect.height + 16, window.innerHeight - 260);

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute rounded-2xl transition-all duration-300"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
        }}
      />

      <div
        className="absolute px-5 w-full transition-all duration-300"
        style={{ top: tooltipTop, left: 0 }}
      >
        <div className="bg-white rounded-2xl p-5 max-w-sm mx-auto shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-[#c9552c]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-1">
            {step + 1}/{steps.length}
          </p>
          <p className="text-base font-bold text-gray-900 mb-1">
            {steps[step].title}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {steps[step].description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={skip}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
            >
              Passer
            </button>
            <button
              onClick={next}
              className="flex-1 bg-[#c9552c] text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {step < steps.length - 1 ? "Suivant" : "Terminé"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
