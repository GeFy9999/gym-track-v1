import {
  LineChart,
  Layers,
  Scale,
  Camera,
  Timer,
  FileSpreadsheet,
  Languages,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: LineChart,
    title: "Graphiques de progression",
    description:
      "Volume par groupe musculaire, estimation de ton 1RM, records par plage de répétitions — vois exactement où tu progresses.",
  },
  {
    icon: Layers,
    title: "Supersets et échauffement",
    description:
      "Regroupe tes exercices en superset et laisse l'app calculer automatiquement tes séries d'échauffement.",
  },
  {
    icon: Scale,
    title: "Mode barre et calculateur de plaques",
    description:
      "Entre le poids total, GymsTrack te dit exactement quelles plaques charger de chaque côté.",
  },
  {
    icon: Camera,
    title: "Poids corporel et photos",
    description:
      "Suis ton poids semaine après semaine et garde des photos de progression pour voir le chemin parcouru.",
  },
  {
    icon: Timer,
    title: "Minuteur de repos intelligent",
    description:
      "Un minuteur entre tes séries, avec notification même quand l'app est en arrière-plan.",
  },
  {
    icon: FileSpreadsheet,
    title: "Import et export CSV",
    description:
      "Arrive avec ton historique d'une autre app, ou exporte tes données quand tu veux. Tes données t'appartiennent.",
  },
  {
    icon: Languages,
    title: "Français et anglais",
    description:
      "Toute l'app est disponible dans les deux langues, change en un clic dans ton profil.",
  },
  {
    icon: Smartphone,
    title: "iOS et Android",
    description:
      "Une seule app, tes données synchronisées, peu importe le téléphone que tu utilises.",
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c] mb-3">
          Fonctionnalités
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-[#191714] tracking-tight">
          Tout ce qu&apos;il faut, rien de superflu
        </h2>
        <p className="text-[#191714]/60 mt-4">
          Pensé par et pour des gens qui s&apos;entraînent sérieusement, sans
          la complexité inutile.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-[#ece7dd] rounded-3xl p-6 hover:bg-[#e4ddcf] transition-colors"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#191714] flex items-center justify-center mb-4">
              <f.icon size={20} className="text-[#f0994a]" />
            </div>
            <h3 className="text-sm font-bold text-[#191714] uppercase tracking-wide mb-1.5">
              {f.title}
            </h3>
            <p className="text-sm text-[#191714]/60 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
