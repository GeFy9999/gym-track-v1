import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["features"];
};

export default function Features({ dict }: Props) {
  return (
    <section id="fonctionnalites" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-5 h-px bg-[#c9552c]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c]">
            {dict.eyebrow}
          </p>
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-[#191714] tracking-tight">
          {dict.title}
        </h2>
        <p className="text-[#191714]/60 mt-3 max-w-lg">{dict.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-[#191714]/10 overflow-hidden">
        {dict.items.map((f, i) => (
          <div
            key={f.title}
            className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 transition-colors hover:bg-[#ece7dd] ${
              i === 0 ? "bg-[#ece7dd]/70" : "bg-[#faf6f1]"
            } ${i !== 0 ? "border-t border-[#191714]/10" : ""}`}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="font-bold text-[#191714] text-sm sm:text-base whitespace-nowrap">
                {f.title}
              </span>
              <span className="text-xs sm:text-sm text-[#191714]/50 truncate">
                {f.description}
              </span>
            </div>
            <ArrowRight size={18} className="text-[#191714]/40 flex-shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
