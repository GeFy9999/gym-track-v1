import type { Dictionary } from "./types";

const fr: Dictionary = {
  nav: {
    features: "Fonctionnalités",
    pricing: "Tarifs",
    faq: "FAQ",
  },
  hero: {
    title: ["Soulève plus.", "Devine moins."],
    subtitle:
      "GymsTrack est l'app de suivi de musculation qui garde tes poids, tes répétitions et tes records en un seul endroit — pour que tu voies vraiment ta progression, séance après séance.",
  },
  demos: {
    eyebrow: "En action",
    title: "Vois GymsTrack en action",
    subtitle: "Du suivi de base aux outils avancés de Pro.",
    free: {
      label: "Version gratuite",
      description: "Suivi de séances, exercices, poids et répétitions",
    },
    pro: {
      label: "Version Pro",
      description: "Graphiques avancés, mode barre, historique illimité",
    },
    comingSoon: "Vidéo à venir",
  },
  phoneMock: {
    thisWeek: "Cette semaine",
    completed: "séances complétées",
    backBiceps: "Dos & Biceps",
    exercises: "6 exercices",
    benchPress: "Développé couché",
    weeklyGain: "+5 lb cette semaine",
    currentStreak: "Série en cours",
    streakWeeks: "12 semaines d'affilée",
  },
  features: {
    eyebrow: "Fonctionnalités",
    title: "Tout ce qu'il faut, rien de superflu",
    subtitle:
      "Pensé par et pour des gens qui s'entraînent sérieusement, sans la complexité inutile.",
    items: [
      {
        title: "Graphiques de progression",
        description:
          "Volume par groupe musculaire, estimation de ton 1RM, records par plage de répétitions — vois exactement où tu progresses.",
      },
      {
        title: "Supersets et échauffement",
        description:
          "Regroupe tes exercices en superset et laisse l'app calculer automatiquement tes séries d'échauffement.",
      },
      {
        title: "Mode barre et calculateur de plaques",
        description:
          "Entre le poids total, GymsTrack te dit exactement quelles plaques charger de chaque côté.",
      },
      {
        title: "Poids corporel et photos",
        description:
          "Suis ton poids semaine après semaine et garde des photos de progression pour voir le chemin parcouru.",
      },
      {
        title: "Minuteur de repos intelligent",
        description:
          "Un minuteur entre tes séries, avec notification même quand l'app est en arrière-plan.",
      },
      {
        title: "Import et export CSV",
        description:
          "Arrive avec ton historique d'une autre app, ou exporte tes données quand tu veux. Tes données t'appartiennent.",
      },
      {
        title: "Français et anglais",
        description:
          "Toute l'app est disponible dans les deux langues, change en un clic dans ton profil.",
      },
      {
        title: "iOS et Android",
        description:
          "Une seule app, tes données synchronisées, peu importe le téléphone que tu utilises.",
      },
    ],
  },
  pricing: {
    proLabel: "PRO",
    plans: [
      {
        name: "Mensuel",
        price: "4,99 $",
        period: "/mois",
        note: "Essai gratuit de 7 jours",
        billing: "Facturé mensuellement",
        highlight: false,
      },
      {
        name: "Annuel",
        price: "29,99 $",
        period: "/an",
        note: "Économise 50 % vs mensuel",
        billing: "Facturé annuellement",
        highlight: true,
      },
      {
        name: "À vie",
        price: "79,99 $",
        period: " une fois",
        note: "Paiement unique, aucun abonnement",
        billing: "Payer une fois",
        highlight: false,
      },
    ],
    mostPopular: "Le plus populaire",
    cta: "Commencer",
    legalNote:
      "Annule à tout moment depuis ton profil. Les abonnements se renouvellent automatiquement sauf annulation avant la fin de la période en cours.",
    loyalty: {
      title: "Plus tu restes, plus tu économises",
      subtitle:
        "Chaque renouvellement de ton abonnement Pro fait baisser le prix du suivant — automatiquement, sans rien faire.",
      monthly: "Mensuel : -0,10 $ par renouvellement, jusqu'à -1,00 $",
      annual: "Annuel : -1,00 $ par renouvellement, jusqu'à -3,00 $",
    },
  },
  comparison: {
    badge: "PRO",
    title: "Fais passer tes séances au niveau supérieur",
    columns: { free: "Gratuit", pro: "Pro", lifetime: "À vie" },
    rows: [
      { label: "Suivi des séances et exercices", free: true, pro: true, lifetime: true },
      { label: "Import CSV", free: true, pro: true, lifetime: true },
      { label: "Minuteur de repos", free: true, pro: true, lifetime: true },
      { label: "Minuteur par exercice", free: false, pro: true, lifetime: true },
      { label: "Historique", free: "90 jours", pro: true, lifetime: true },
      { label: "Vue calendrier", free: false, pro: true, lifetime: true },
      { label: "Export CSV", free: false, pro: true, lifetime: true },
      { label: "Graphiques avancés (volume, 1RM, records)", free: false, pro: true, lifetime: true },
      { label: "Supersets", free: false, pro: true, lifetime: true },
      { label: "Échauffement automatique", free: false, pro: true, lifetime: true },
      { label: "Mode barre et calculateur de plaques", free: false, pro: true, lifetime: true },
      { label: "Photos de progression", free: false, pro: true, lifetime: true },
      { label: "Réorganisation par glisser-déposer", free: false, pro: true, lifetime: true },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    items: [
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
    ],
  },
  footer: {
    privacy: "Confidentialité",
    terms: "Conditions",
    legal: "Mentions légales",
    rights: "Tous droits réservés.",
  },
  meta: {
    title: "GymsTrack — Suis tes séances, progresse chaque semaine",
    description:
      "L'app de suivi de musculation simple et puissante : séances guidées, graphiques de progression, records personnels et photos de progrès. Disponible sur iOS et Android.",
  },
};

export default fr;
