import { useState, useEffect, useRef, useLayoutEffect } from "react";

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

type Rect = { top: number; left: number; width: number; height: number };

const POLL_INTERVAL_MS = 100;
const MAX_POLL_ATTEMPTS = 30; // ~3s — covers a normal data fetch/render cycle
const EDGE_MARGIN = 16;

export default function TourOverlay({ tourKey, steps, refs }: Props) {
  const storageKey = `tour_${tourKey}`;
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(220);
  const initialized = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const done = localStorage.getItem(storageKey);
    if (!done) {
      setTimeout(() => setStep(0), 400);
    }
  }, [storageKey]);

  const findTarget = (s: TourStep): HTMLElement | null => {
    if (s.selector) return document.querySelector<HTMLElement>(s.selector);
    if (s.refIndex !== undefined && refs) return refs[s.refIndex]?.current ?? null;
    return null;
  };

  const finish = () => {
    setStep(null);
    localStorage.setItem(storageKey, "true");
  };

  // Lock page scroll while the tour is active — otherwise the user can
  // scroll the page out from under the highlight, which only re-measures
  // on step change or window resize and would then point at empty space.
  useEffect(() => {
    if (step === null) return;
    const { body, documentElement: html } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [step === null]);

  // Resolve the current step's target and highlight it. A target may not be
  // in the DOM yet the instant a step becomes active — data can still be
  // loading (History's week list, a just-added set row) — so this polls for
  // a few seconds before giving up. Only once it's truly never going to
  // appear (a feature toggle is off, etc.) does it skip to the next step,
  // instead of leaving the user stuck looking at a blank overlay.
  useEffect(() => {
    if (step === null) return;
    let cancelled = false;
    let pollTimeout: ReturnType<typeof setTimeout> | undefined;

    // Scroll instantly rather than "smooth" — an animated scroll has no
    // reliable end event, so measuring the target either races the
    // animation (wrong rect) or requires guessing when it's done (still
    // sometimes wrong on short/oddly-timed scrolls). An instant scroll
    // completes synchronously, so the rect measured right after is always
    // correct; the highlight box still glides smoothly to it via its own
    // CSS transition.
    const highlight = (el: HTMLElement) => {
      const before = el.getBoundingClientRect();
      const alreadyVisible =
        before.top >= EDGE_MARGIN &&
        before.bottom <= window.innerHeight - EDGE_MARGIN;

      if (!alreadyVisible) {
        el.scrollIntoView({ behavior: "auto", block: "center" });
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    let attempts = 0;
    const poll = () => {
      if (cancelled) return;
      const el = findTarget(steps[step]);
      if (el) {
        highlight(el);
        return;
      }
      attempts++;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (step < steps.length - 1) setStep(step + 1);
        else finish();
        return;
      }
      pollTimeout = setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(pollTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const handleResize = () => {
      if (step === null) return;
      const el = findTarget(steps[step]);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, steps, refs]);

  // Measure the tooltip's real height (it varies with text length and
  // screen width) before paint, so the position calculation below never has
  // to guess — a guess is what let the tooltip cover the highlighted zone
  // on narrower/shorter phone screens.
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [step, rect]);

  const next = () => {
    if (step === null) return;
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const skip = () => finish();

  if (step === null || !rect) return null;

  const forceAbove = steps[step].tooltipPosition === "above";
  const spaceBelow = window.innerHeight - (rect.top + rect.height) - EDGE_MARGIN;
  const spaceAbove = rect.top - EDGE_MARGIN;
  const placeAbove =
    forceAbove || (spaceBelow < tooltipHeight && spaceAbove > spaceBelow);

  let tooltipTop = placeAbove
    ? rect.top - tooltipHeight - EDGE_MARGIN
    : rect.top + rect.height + EDGE_MARGIN;
  // Final clamp so the tooltip always stays fully on-screen, even if it's
  // taller than the space on either side (a short/narrow phone viewport).
  tooltipTop = Math.max(
    EDGE_MARGIN,
    Math.min(tooltipTop, window.innerHeight - tooltipHeight - EDGE_MARGIN),
  );

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
        <div
          ref={tooltipRef}
          className="bg-white rounded-2xl p-5 max-w-sm mx-auto shadow-xl"
        >
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
