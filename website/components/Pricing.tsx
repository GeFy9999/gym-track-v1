import { Check } from "lucide-react";

const proFeatures = [
  "Historique illimité (au-delà de 90 jours)",
  "Vue calendrier de ton historique",
  "Export CSV de tes séances",
  "Graphiques avancés : volume, 1RM, records par répétitions",
  "Supersets et échauffement automatique",
  "Mode barre et calculateur de plaques",
  "Photos de progression illimitées",
];

const plans = [
  {
    name: "Mensuel",
    price: "4,99 $",
    period: "/mois",
    note: "Essai gratuit de 7 jours",
    highlight: false,
  },
  {
    name: "Annuel",
    price: "29,99 $",
    period: "/an",
    note: "Économise 50 % vs mensuel",
    highlight: true,
  },
  {
    name: "À vie",
    price: "79,99 $",
    period: " une fois",
    note: "Paiement unique, aucun abonnement",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="tarifs" className="bg-[#191714] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#f0994a] mb-3">
            Tarifs
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Gratuit pour commencer, Pro quand tu es prêt
          </h2>
          <p className="text-white/50 mt-4">
            L&apos;essentiel du suivi d&apos;entraînement est gratuit. Pro
            débloque les outils avancés pour les séances sérieuses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-7 ${
                plan.highlight
                  ? "bg-[#c9552c] shadow-xl shadow-[#c9552c]/20 md:-translate-y-2"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.highlight && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/15 inline-block px-3 py-1 rounded-full mb-4">
                  Le plus populaire
                </p>
              )}
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  plan.highlight ? "text-white/70" : "text-white/40"
                }`}
              >
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-black text-white">
                  {plan.price}
                </span>
                <span
                  className={plan.highlight ? "text-white/70" : "text-white/40"}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`text-sm ${plan.highlight ? "text-white/80" : "text-white/40"}`}
              >
                {plan.note}
              </p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40 mb-5">
            Inclus avec Pro
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {proFeatures.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#3a9e6e]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-[#3a9e6e]" strokeWidth={3} />
                </div>
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
