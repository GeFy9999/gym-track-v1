import { Check } from "lucide-react";
import PlanSelector from "./PlanSelector";
import type { Dictionary, Locale } from "@/dictionaries";

type Props = {
  dict: Dictionary["comparison"];
  pricingDict: Dictionary["pricing"];
  locale: Locale;
};

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <Check size={18} className="text-[#3a9e6e]" strokeWidth={2.5} />
      </div>
    );
  }
  // Not included — a plain dash reads as "not part of this plan" without
  // the harsher, more negative weight of a visible X mark on every other
  // row, which made the free column look emptier than it actually is.
  if (value === false) {
    return <p className="text-center text-white/15 text-sm select-none">—</p>;
  }
  return <p className="text-center text-sm text-white/40">{value}</p>;
}

export default function FeatureComparison({ dict, pricingDict, locale }: Props) {
  return (
    <section id="tarifs" className="bg-[#191714] py-16 sm:py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <span className="text-lg font-black tracking-tight text-white">
              GymsTrack
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#f0994a] text-[#191714] px-2.5 py-1 rounded-full">
              {dict.badge}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8 max-w-md">
            {dict.title}
          </h2>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[300px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left pb-3 font-normal" />
                  <th className="pb-3 w-20 sm:w-28 text-[11px] sm:text-sm font-bold text-white/50 uppercase tracking-wide">
                    {dict.columns.free}
                  </th>
                  <th className="pb-3 w-20 sm:w-28 text-[11px] sm:text-sm font-bold text-[#f0994a] uppercase tracking-wide">
                    {dict.columns.pro}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dict.rows.map((row) => (
                  <tr key={row.label} className="border-b border-white/5 last:border-0">
                    <td className="py-3.5 pr-2 text-[13px] sm:text-sm font-semibold text-white">
                      {row.label}
                    </td>
                    <td className="py-3.5">
                      <Cell value={row.free} />
                    </td>
                    <td className="py-3.5">
                      <Cell value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <PlanSelector dict={pricingDict} locale={locale} />
      </div>
    </section>
  );
}
