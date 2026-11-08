import { ArrowRight, Calculator, Disc3, Layers } from "lucide-react";
import PhoneVideo from "./PhoneVideo";
import type { Dictionary } from "@/dictionaries";

const icons = [Disc3, Calculator, Layers];

type Props = {
  dict: Dictionary["demos"];
};

// Pro spotlight: a short screen recording of bar mode / plate loading, the
// Pro feature that reads best on its own in a few seconds.
export default function Demos({ dict }: Props) {
  return (
    <section className="py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wide bg-[#c9552c] text-white px-2.5 py-1 rounded-full">
              {dict.badge}
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c]">
              {dict.eyebrow}
            </p>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#191714] tracking-tight leading-[1.05]">
            {dict.title}
          </h2>
          <p className="text-[#191714]/70 text-lg mt-5 leading-relaxed">{dict.body}</p>

          <div className="space-y-6 mt-10">
            {dict.points.map((point, i) => {
              const Icon = icons[i];
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className="text-[#c9552c]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#191714] mb-1">{point.title}</h3>
                    <p className="text-sm text-[#191714]/60 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-[#191714]/50 mt-8">{dict.alsoInPro}</p>
          <a
            href="#tarifs"
            className="inline-flex items-center gap-2 mt-4 bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-full shadow-sm hover:bg-[#b44a25] transition-colors"
          >
            {dict.cta}
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#f0994a]/15 blur-3xl"
          />
          <div className="relative w-full">
            <PhoneVideo src="/demo-mode-barre.mp4" label={dict.videoLabel} />
          </div>
        </div>
      </div>
    </section>
  );
}
