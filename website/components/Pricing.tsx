import { Check, Sparkles } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["pricing"];
};

export default function Pricing({ dict }: Props) {
  return (
    <section id="tarifs" className="bg-[#191714] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#f0994a] mb-3">
            {dict.eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {dict.title}
          </h2>
          <p className="text-white/50 mt-4">{dict.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {dict.plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-7 ${
                plan.highlight
                  ? "bg-[#c9552c] shadow-xl shadow-[#c9552c]/20 md:-translate-y-2"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.highlight && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/15 inline-block px-3 py-1 rounded-full mb-4">
                  {dict.mostPopular}
                </p>
              )}
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  plan.highlight ? "text-white/70" : "text-white/40"
                }`}
              >
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black text-white">
                  {plan.price}
                </span>
                <span
                  className={plan.highlight ? "text-white/70" : "text-white/40"}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`text-sm ${plan.highlight ? "text-white/80" : "text-white/40"}`}
              >
                {plan.note}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 mb-12 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f0994a]/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-[#f0994a]" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">{dict.loyalty.title}</h3>
            <p className="text-sm text-white/50 mb-3">{dict.loyalty.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-white/70">
              <span>{dict.loyalty.monthly}</span>
              <span>{dict.loyalty.annual}</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40 mb-5">
            {dict.includedTitle}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {dict.includedFeatures.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#3a9e6e]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-[#3a9e6e]" strokeWidth={3} />
                </div>
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
