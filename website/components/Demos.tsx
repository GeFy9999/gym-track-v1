import { Play } from "lucide-react";
import PhoneMockup from "./PhoneMockup";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["demos"];
  phoneDict: Dictionary["phoneMock"];
};

// Real screen-recorded demos (free + Pro) will replace these placeholder
// frames once they exist — see conversation notes. The illustrative phone
// mockup stands in for a video thumbnail in the meantime.
export default function Demos({ dict, phoneDict }: Props) {
  const cards = [
    { ...dict.free, accent: "#3a9e6e" },
    { ...dict.pro, accent: "#c9552c" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c] mb-3">
          {dict.eyebrow}
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-[#191714] tracking-tight">
          {dict.title}
        </h2>
        <p className="text-[#191714]/60 mt-4">{dict.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#ece7dd] rounded-3xl p-5 sm:p-8">
            <div className="relative flex items-center justify-center py-6 sm:py-8">
              <div className="opacity-50 w-full max-w-[200px] sm:max-w-[260px]">
                <PhoneMockup dict={phoneDict} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: card.accent }}
                >
                  <Play size={24} className="text-white ml-1" fill="currentColor" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#191714]/50 bg-[#faf6f1] px-3 py-1.5 rounded-full">
                  {dict.comingSoon}
                </p>
              </div>
            </div>
            <h3 className="text-sm font-bold text-[#191714] uppercase tracking-wide mt-4">
              {card.label}
            </h3>
            <p className="text-sm text-[#191714]/60 mt-1">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
