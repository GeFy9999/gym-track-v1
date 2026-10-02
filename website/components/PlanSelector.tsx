"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["pricing"];
};

// Purely a visual plan picker for now — selecting a plan doesn't create a
// Stripe Checkout session yet. See conversation notes: wiring real payment
// here means deciding how an anonymous marketing-site visitor (no GymsTrack
// account yet) ends up with a paid subscription attached to one.
export default function PlanSelector({ dict }: Props) {
  const defaultIndex = dict.plans.findIndex((p) => p.highlight);
  const [selected, setSelected] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  return (
    <div>
      <div className="space-y-3">
        {dict.plans.map((plan, i) => {
          const isSelected = i === selected;
          return (
            <button
              key={plan.name}
              type="button"
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-2xl p-5 border transition-colors ${
                isSelected
                  ? "border-[#c9552c] bg-[#c9552c]/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "border-[#c9552c]" : "border-white/30"
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#c9552c]" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold text-[#f0994a]">{dict.proLabel}</span>{" "}
                      <span className="font-bold text-white">{plan.name}</span>
                    </p>
                    <p className="text-lg font-black text-white mt-0.5">
                      {plan.price}
                      <span className="text-sm font-normal text-white/40">
                        {plan.period}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-white/40 text-right flex-shrink-0">
                  {plan.billing}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <a
        href="#telecharger"
        className="block text-center mt-5 bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide py-4 rounded-full shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {dict.cta}
      </a>

      <div className="flex items-center justify-center gap-2 mt-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide bg-[#3a9e6e]/15 text-[#3a9e6e] px-3 py-1.5 rounded-full">
          <Sparkles size={13} />
          {dict.loyalty.title}
        </span>
      </div>
      <p className="text-center text-xs font-semibold text-white/50 mt-2">
        {dict.loyalty.monthly} · {dict.loyalty.annual}
      </p>

      <p className="text-xs text-white/30 text-center mt-5 leading-relaxed">
        {dict.legalNote}
      </p>
    </div>
  );
}
