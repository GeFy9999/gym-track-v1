import { Dumbbell, Shuffle, Zap } from "lucide-react";
import PhoneMockup from "./PhoneMockup";
import type { Dictionary } from "@/dictionaries";

const icons = [Dumbbell, Shuffle, Zap];

type Props = {
  dict: Dictionary["about"];
  phoneDict: Dictionary["phoneMock"];
};

export default function About({ dict, phoneDict }: Props) {
  return (
    <section className="bg-[#ece7dd] py-16 sm:py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-5 h-px bg-[#c9552c]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c]">
              {dict.eyebrow}
            </p>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#191714] tracking-tight">
            {dict.title}
          </h2>
          <p className="text-[#191714]/60 mt-4 leading-relaxed">{dict.body}</p>

          <div className="space-y-5 mt-8">
            {dict.points.map((point, i) => {
              const Icon = icons[i];
              return (
                <div key={point.title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#191714] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#f0994a]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#191714] mb-1">{point.title}</h3>
                    <p className="text-sm text-[#191714]/60 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <PhoneMockup dict={phoneDict} />
        </div>
      </div>
    </section>
  );
}
