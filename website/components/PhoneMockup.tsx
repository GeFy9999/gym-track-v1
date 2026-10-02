import { Flame, Dumbbell, TrendingUp, Check } from "lucide-react";

// A stylized, illustrative mock of the app's dashboard — not a literal
// screenshot — built from the same colors/shapes as the real UI so it reads
// as authentic without depending on an exported image asset.
export default function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-[#191714] bg-[#191714] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#191714] rounded-b-2xl z-10" />
        <div className="bg-[#faf6f1] rounded-[2rem] overflow-hidden">
          <div className="bg-[#191714] px-5 pt-9 pb-7">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Cette semaine
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black text-white">4/5</span>
              <span className="text-xs font-bold text-[#f0994a] mb-1">
                séances complétées
              </span>
            </div>
            <div className="flex gap-1.5 mt-4">
              {[1, 1, 1, 1, 0].map((done, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${done ? "bg-[#c9552c]" : "bg-white/15"}`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-4 space-y-2.5">
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={18} className="text-[#c9552c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#191714] uppercase truncate">
                  Dos &amp; Biceps
                </p>
                <p className="text-[10px] text-gray-400">6 exercices</p>
              </div>
              <Check size={14} className="text-[#3a9e6e] flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#3a9e6e]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-[#3a9e6e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#191714] uppercase truncate">
                  Développé couché
                </p>
                <p className="text-[10px] text-[#3a9e6e] font-semibold">
                  +5 lb cette semaine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#f0994a]/15 flex items-center justify-center flex-shrink-0">
                <Flame size={18} className="text-[#c9552c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#191714] uppercase truncate">
                  Série en cours
                </p>
                <p className="text-[10px] text-gray-400">12 semaines d&apos;affilée</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
