import { Check, X } from "lucide-react";
import PlanSelector from "./PlanSelector";
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
        <X size={16} className="text-white/20" strokeWidth={2.5} />
      </div>
    );
  }
  return <p className="text-center text-sm text-white/40">{value}</p>;
}

export default function FeatureComparison({ dict, pricingDict }: Props) {
  return (
    <section id="tarifs" className="bg-[#191714] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <span className="text-lg font-black tracking-tight text-white">
              GymsTrack
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#f0994a] text-[#191714] px-2.5 py-1 rounded-full">
              {dict.badge}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-8 max-w-md">
            {dict.title}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left pb-3 font-normal" />
                  <th className="pb-3 w-24 text-sm font-bold text-white/50 uppercase tracking-wide">
                    {dict.columns.free}
                  </th>
                  <th className="pb-3 w-24 text-sm font-bold text-[#f0994a] uppercase tracking-wide">
                    {dict.columns.pro}
                  </th>
                  <th className="pb-3 w-24 text-sm font-bold text-white/50 uppercase tracking-wide">
                    {dict.columns.lifetime}
                  </th>
                </tr>
              </thead>
              <tbody>
                {dict.rows.map((row) => (
                  <tr key={row.label} className="border-b border-white/5 last:border-0">
                    <td className="py-3.5 text-sm font-semibold text-white">
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
        </div>

        <PlanSelector dict={pricingDict} />
      </div>
    </section>
  );
}
