const faqs = [
  {
    q: "Est-ce que GymsTrack est gratuit ?",
    a: "Oui. Le suivi de tes séances, exercices, poids et répétitions est gratuit, sans limite de temps. L'abonnement Pro débloque des outils avancés comme l'historique illimité, les graphiques de progression avancés et le mode barre.",
  },
  {
    q: "Mes données sont-elles sauvegardées ?",
    a: "Oui, ton compte et tes données sont sauvegardés en ligne — change de téléphone sans rien perdre. Tu peux aussi exporter tout ton historique en CSV à tout moment.",
  },
  {
    q: "Puis-je annuler mon abonnement Pro à tout moment ?",
    a: "Oui, directement depuis ton profil dans l'app. Tu gardes l'accès Pro jusqu'à la fin de ta période payée, sans engagement.",
  },
  {
    q: "L'app est-elle disponible en anglais ?",
    a: "Oui, GymsTrack est entièrement bilingue français et anglais — change de langue en un clic dans les paramètres de ton profil.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-20 md:py-28">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c] mb-3">
          FAQ
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-[#191714] tracking-tight">
          Questions fréquentes
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="bg-[#ece7dd] rounded-2xl p-6">
            <h3 className="font-bold text-[#191714] mb-2">{item.q}</h3>
            <p className="text-sm text-[#191714]/60 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
