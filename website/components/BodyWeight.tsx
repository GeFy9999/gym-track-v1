import Image from "next/image";
import { CalendarCheck, TrendingDown, Scale } from "lucide-react";
import PhoneFrame from "./PhoneFrame";
import type { Dictionary } from "@/dictionaries";

const icons = [CalendarCheck, TrendingDown, Scale];

type Props = {
  dict: Dictionary["bodyWeight"];
};

// Stats screen screenshot (430×914) centred on the body-weight chart.
export default function BodyWeight({ dict }: Props) {
  return (
    <section className="bg-[#ece7dd] py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Phone first on desktop (left), after the text on mobile. */}
        <div className="relative flex justify-center order-2 lg:order-1">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#c9552c]/10 blur-3xl"
          />
          <div className="relative w-full">
            <PhoneFrame aspectRatio="430 / 914">
              <Image
                src="/stats-poids-corporel.png"
                alt={dict.imageAlt}
                fill
                sizes="300px"
                className="object-cover"
              />
            </PhoneFrame>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-5 h-px bg-[#c9552c]" />
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
        </div>
      </div>
    </section>
  );
}
