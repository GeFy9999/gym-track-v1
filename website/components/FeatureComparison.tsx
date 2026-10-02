import Image from "next/image";
import { Check, X, Sparkles } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["comparison"];
  pricingDict: Dictionary["pricing"];
};

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <Check size={18} className="text-[#3a9e6e]" strokeWidth={2.5} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <X size={16} className="text-gray-300" strokeWidth={2.5} />
      </div>
    );
  }
  return <p className="text-center text-sm text-gray-400">{value}</p>;
}

export default function FeatureComparison({ dict, pricingDict }: Props) {
  return (
    <section id="tarifs" className="max-w-4xl mx-auto px-6 py-20 md:py-28">
      <div className="bg-[#ece7dd] rounded-3xl p-6 sm:p-10">
        <div className="flex items-center gap-2.5 mb-6">
          <Image src="/logo.webp" alt="GymsTrack" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-black tracking-tight text-[#191714]">
            GymsTrack
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide bg-[#f0994a] text-[#191714] px-2.5 py-1 rounded-full">
            {dict.badge}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#191714] tracking-tight mb-8 max-w-md">
          {dict.title}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className="border-b border-[#191714]/10">
                <th className="text-left pb-3 font-normal" />
                <th className="pb-3 w-24 text-sm font-bold text-[#191714]/50 uppercase tracking-wide">
                  {dict.columns.free}
                </th>
                <th className="pb-3 w-24 text-sm font-bold text-[#c9552c] uppercase tracking-wide">
                  {dict.columns.pro}
                </th>
                <th className="pb-3 w-24 text-sm font-bold text-[#191714]/50 uppercase tracking-wide">
                  {dict.columns.lifetime}
                </th>
              </tr>
            </thead>
            <tbody>
              {dict.rows.map((row) => (
                <tr key={row.label} className="border-b border-[#191714]/5 last:border-0">
                  <td className="py-3.5 text-sm font-semibold text-[#191714]">
                    {row.label}
                  </td>
                  <td className="py-3.5">
                    <Cell value={row.free} />
                  </td>
                  <td className="py-3.5">
                    <Cell value={row.pro} />
                  </td>
                  <td className="py-3.5">
                    <Cell value={row.lifetime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#191714]/10 mt-8 pt-8">
          <div className="grid sm:grid-cols-3 gap-4">
            {pricingDict.plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-5 ${
                  plan.highlight
                    ? "bg-[#191714] shadow-lg"
                    : "bg-white/60"
                }`}
              >
                {plan.highlight && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#f0994a] mb-2">
                    {pricingDict.mostPopular}
                  </p>
                )}
                <p
                  className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                    plan.highlight ? "text-white/50" : "text-[#191714]/40"
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${plan.highlight ? "text-white" : "text-[#191714]"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.highlight ? "text-white/50" : "text-[#191714]/40"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-xs mt-1 ${plan.highlight ? "text-white/60" : "text-[#191714]/50"}`}
                >
                  {plan.note}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide bg-[#3a9e6e]/15 text-[#2f7d58] px-3 py-1.5 rounded-full">
              <Sparkles size={13} />
              {pricingDict.loyalty.title}
            </span>
          </div>
          <p className="text-center text-xs text-[#191714]/50 mt-2 max-w-sm mx-auto">
            {pricingDict.loyalty.subtitle}
          </p>
          <p className="text-center text-xs font-semibold text-[#191714]/60 mt-1 max-w-sm mx-auto">
            {pricingDict.loyalty.monthly} · {pricingDict.loyalty.annual}
          </p>

          <div className="flex justify-center mt-6">
            <a
              href="#telecharger"
              className="bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide px-8 py-3.5 rounded-full shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {pricingDict.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
