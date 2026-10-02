import Image from "next/image";
import { Check, X } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["comparison"];
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

export default function FeatureComparison({ dict }: Props) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 md:py-28">
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
      </div>
    </section>
  );
}
