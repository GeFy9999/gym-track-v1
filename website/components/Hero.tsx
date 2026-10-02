import { Apple, Play } from "lucide-react";
import PhoneMockup from "./PhoneMockup";
import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["hero"];
  phoneDict: Dictionary["phoneMock"];
};

export default function Hero({ dict, phoneDict }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-block text-xs font-bold uppercase tracking-widest text-[#c9552c] bg-[#c9552c]/10 px-3 py-1.5 rounded-full mb-5">
            {dict.badge}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-[#191714] leading-[1.1] tracking-tight">
            {dict.title[0]}
            <br />
            {dict.title[1]}
          </h1>
          <p className="text-base sm:text-lg text-[#191714]/60 mt-5 max-w-md leading-relaxed">
            {dict.subtitle}
          </p>

          <div id="telecharger" className="flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2.5 bg-[#191714] text-white px-5 py-3 rounded-2xl opacity-60 cursor-not-allowed select-none">
              <Apple size={22} />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wide text-white/60">
                  {dict.comingSoon}
                </p>
                <p className="text-sm font-bold">{dict.appStore}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-[#191714] text-white px-5 py-3 rounded-2xl opacity-60 cursor-not-allowed select-none">
              <Play size={20} />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wide text-white/60">
                  {dict.comingSoon}
                </p>
                <p className="text-sm font-bold">{dict.googlePlay}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#191714]/40 mt-3">{dict.releaseNote}</p>
        </div>

        <div className="order-first md:order-last">
          <PhoneMockup dict={phoneDict} />
        </div>
      </div>
    </section>
  );
}
