import { Dumbbell, Shuffle, Zap } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const icons = [Dumbbell, Shuffle, Zap];

type Props = {
  dict: Dictionary["about"];
};

export default function About({ dict }: Props) {
  return (
    <section className="bg-[#ece7dd] py-16 sm:py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-5 h-px bg-[#c9552c]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c]">
            {dict.eyebrow}
          </p>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#191714] tracking-tight max-w-lg">
          {dict.title}
        </h2>
        <p className="text-[#191714]/60 mt-4 max-w-xl leading-relaxed">{dict.body}</p>

        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          {dict.points.map((point, i) => {
            const Icon = icons[i];
            return (
              <div key={point.title} className="bg-[#faf6f1] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-[#191714] flex items-center justify-center mb-3">
                  <Icon size={16} className="text-[#f0994a]" />
                </div>
                <h3 className="text-sm font-bold text-[#191714] mb-1.5">{point.title}</h3>
                <p className="text-sm text-[#191714]/60 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
