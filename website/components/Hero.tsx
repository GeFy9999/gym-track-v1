import { Apple, Play } from "lucide-react";
import PhoneMockup from "./PhoneMockup";

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="inline-block text-xs font-bold uppercase tracking-widest text-[#c9552c] bg-[#c9552c]/10 px-3 py-1.5 rounded-full mb-5">
            Gratuit pour commencer
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-[#191714] leading-[1.1] tracking-tight">
            Suis tes séances.
            <br />
            Progresse chaque semaine.
          </h1>
          <p className="text-base sm:text-lg text-[#191714]/60 mt-5 max-w-md leading-relaxed">
            GymsTrack est l&apos;app de suivi de musculation qui garde tes
            poids, tes répétitions et tes records en un seul endroit — pour
            que tu voies vraiment ta progression, séance après séance.
          </p>

          <div id="telecharger" className="flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2.5 bg-[#191714] text-white px-5 py-3 rounded-2xl opacity-60 cursor-not-allowed select-none">
              <Apple size={22} />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wide text-white/60">
                  Bientôt sur
                </p>
                <p className="text-sm font-bold">App Store</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-[#191714] text-white px-5 py-3 rounded-2xl opacity-60 cursor-not-allowed select-none">
              <Play size={20} />
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wide text-white/60">
                  Bientôt sur
                </p>
                <p className="text-sm font-bold">Google Play</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-[#191714]/40 mt-3">
            Sortie prévue prochainement — reste à l&apos;affût.
          </p>
        </div>

        <div className="order-first md:order-last">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
