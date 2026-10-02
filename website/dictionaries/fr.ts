import type { Dictionary } from "./types";

const fr: Dictionary = {
  nav: {
    features: "Fonctionnalités",
    pricing: "Tarifs",
    faq: "FAQ",
    download: "Télécharger",
  },
  hero: {
    badge: "Gratuit pour commencer",
    title: ["Suis tes séances.", "Progresse chaque semaine."],
    subtitle:
      "GymsTrack est l'app de suivi de musculation qui garde tes poids, tes répétitions et tes records en un seul endroit — pour que tu voies vraiment ta progression, séance après séance.",
    comingSoon: "Bientôt sur",
    appStore: "App Store",
    googlePlay: "Google Play",
    releaseNote: "Sortie prévue prochainement — reste à l'affût.",
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
    eyebrow: "Tarifs",
    title: "Gratuit pour commencer, Pro quand tu es prêt",
    subtitle:
      "L'essentiel du suivi d'entraînement est gratuit. Pro débloque les outils avancés pour les séances sérieuses.",
    plans: [
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
    ],
    mostPopular: "Le plus populaire",
    includedTitle: "Inclus avec Pro",
    includedFeatures: [
      "Historique illimité (au-delà de 90 jours)",
      "Vue calendrier de ton historique",
      "Export CSV de tes séances",
      "Graphiques avancés : volume, 1RM, records par répétitions",
      "Supersets et échauffement automatique",
      "Mode barre et calculateur de plaques",
      "Photos de progression illimitées",
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
