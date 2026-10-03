import {
  LineChart,
  Layers,
  Scale,
  Camera,
  Timer,
  FileSpreadsheet,
  Languages,
  Smartphone,
} from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const icons = [
  LineChart,
  Layers,
  Scale,
  Camera,
  Timer,
  FileSpreadsheet,
  Languages,
  Smartphone,
];

type Props = {
  dict: Dictionary["features"];
};

export default function Features({ dict }: Props) {
  return (
    <section id="fonctionnalites" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c] mb-3">
          {dict.eyebrow}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-[#191714] tracking-tight">
          {dict.title}
        </h2>
        <p className="text-[#191714]/60 mt-4">{dict.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dict.items.map((f, i) => {
          const Icon = icons[i];
          return (
            <div
              key={f.title}
              className="bg-[#ece7dd] rounded-3xl p-6 hover:bg-[#e4ddcf] transition-colors"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#191714] flex items-center justify-center mb-4">
                <Icon size={20} className="text-[#f0994a]" />
              </div>
              <h3 className="text-sm font-bold text-[#191714] uppercase tracking-wide mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-[#191714]/60 leading-relaxed">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
