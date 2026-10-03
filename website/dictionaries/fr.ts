import type { Dictionary } from "./types";

const fr: Dictionary = {
  nav: {
    features: "Fonctionnalités",
    pricing: "Tarifs",
    faq: "FAQ",
    login: "Se connecter",
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
  about: {
    eyebrow: "Comment nous fonctionnons",
    title: "Des séances, pas des routines figées",
    body: "La plupart des apps comme Strong ou Hevy te demandent de construire une routine d'avance, exercice par exercice, avant même de commencer à t'entraîner. GymsTrack fonctionne différemment : tu choisis un groupe musculaire, tu démarres ta séance, et tu ajoutes tes exercices au fur et à mesure — exactement comme tu t'entraînes vraiment.",
    points: [
      {
        title: "Par séance, pas par exercice",
        description:
          "Organise-toi autour de tes journées d'entraînement (Dos, Jambes, Push...) plutôt que de routines rigides à préparer d'avance.",
      },
      {
        title: "Flexible dès le départ",
        description:
          "Improvise ta séance en temps réel — ajoute, retire ou réordonne tes exercices sans jamais être bloqué par un plan figé.",
      },
      {
        title: "Le suivi suit, sans friction",
        description:
          "Poids, répétitions et progression sont enregistrés automatiquement, peu importe comment ta séance évolue.",
      },
    ],
  },
  pricing: {
    proLabel: "PRO",
    plans: [
      {
        key: "monthly",
        name: "Mensuel",
        price: "4,99 $",
        period: "/mois",
        note: "Essai gratuit de 7 jours",
        billing: "Facturé mensuellement",
        highlight: false,
      },
      {
        key: "annual",
        name: "Annuel",
        price: "29,99 $",
        period: "/an",
        note: "Économise 50 % vs mensuel",
        billing: "Facturé annuellement",
        highlight: true,
      },
      {
        key: "lifetime",
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
    columns: { free: "Gratuit", pro: "Pro" },
    rows: [
      { label: "Suivi des séances et exercices", free: true, pro: true },
      { label: "Import CSV", free: true, pro: true },
      { label: "Minuteur de repos", free: true, pro: true },
      { label: "Minuteur par exercice", free: false, pro: true },
      { label: "Historique", free: "90 jours", pro: true },
      { label: "Vue calendrier", free: false, pro: true },
      { label: "Export CSV", free: false, pro: true },
      { label: "Graphiques avancés (volume, 1RM, records)", free: false, pro: true },
      { label: "Supersets", free: false, pro: true },
      { label: "Échauffement automatique", free: false, pro: true },
      { label: "Mode barre et calculateur de plaques", free: false, pro: true },
      { label: "Photos de progression", free: false, pro: true },
      { label: "Réorganisation par glisser-déposer", free: false, pro: true },
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
  auth: {
    continueWithGoogle: "Continuer avec Google",
    login: {
      subtitle: "Connecte-toi à ton compte",
      email: "Courriel",
      emailPlaceholder: "ton@courriel.com",
      password: "Mot de passe",
      submit: "Se connecter",
      submitting: "Connexion...",
      forgotPassword: "Mot de passe oublié ?",
      or: "ou",
      noAccount: "Pas encore de compte ?",
      createAccount: "Créer un compte",
      errors: {
        emailRequired: "Le courriel est requis",
        emailInvalid: "Courriel invalide",
        passwordRequired: "Le mot de passe est requis",
        generic: "Erreur de connexion",
        unknown: "Erreur inconnue",
      },
    },
    register: {
      subtitle: "Crée ton compte",
      name: "Nom",
      namePlaceholder: "Ton nom",
      email: "Courriel",
      emailPlaceholder: "ton@courriel.com",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      submit: "Créer mon compte",
      submitting: "Création...",
      or: "ou",
      haveAccount: "Déjà un compte ?",
      signIn: "Se connecter",
      legalPrefix: "En créant un compte, tu acceptes nos",
      termsLink: "conditions d'utilisation",
      legalAnd: "et notre",
      privacyLink: "politique de confidentialité",
      strength: { weak: "Faible", medium: "Moyen", good: "Correct" },
      rules: {
        minLength: "Minimum 8 caractères",
        uppercase: "Une lettre majuscule",
        lowercase: "Une lettre minuscule",
        digit: "Un chiffre",
        special: "Un caractère spécial (!@#$...)",
      },
      errors: {
        nameMin: "Le nom doit contenir au moins 2 caractères",
        nameMax: "Le nom ne peut pas dépasser 50 caractères",
        emailRequired: "Le courriel est requis",
        emailInvalid: "Courriel invalide",
        passwordMin: "Minimum 8 caractères",
        passwordUppercase: "Doit contenir une majuscule",
        passwordLowercase: "Doit contenir une minuscule",
        passwordDigit: "Doit contenir un chiffre",
        passwordSpecial: "Doit contenir un caractère spécial",
        confirmRequired: "Confirme ton mot de passe",
        passwordMismatch: "Les mots de passe ne correspondent pas",
        generic: "Erreur lors de l'inscription",
        unknown: "Erreur inconnue",
      },
    },
    forgotPassword: {
      title: "Mot de passe oublié",
      subtitle: "Entre ton courriel et on t'envoie un lien pour réinitialiser ton mot de passe.",
      email: "Courriel",
      emailPlaceholder: "ton@courriel.com",
      sendLink: "Envoyer le lien",
      emailSent: "Courriel envoyé",
      emailSentDesc: "Un lien de réinitialisation a été envoyé à {email}. Vérifie ta boîte de réception.",
      backToLogin: "Retour à la connexion",
      resendSuccess: "Courriel renvoyé avec succès",
      noEmailReceived: "Tu ne reçois rien ? Vérifie tes indésirables ou",
      retryIn: "Réessayer dans {time}",
      sending: "Envoi...",
      retry: "réessaie",
      errors: {
        emailRequired: "Le courriel est requis",
        emailInvalid: "Courriel invalide",
        generic: "Erreur",
      },
    },
    resetPassword: {
      title: "Nouveau mot de passe",
      subtitle: "Choisis un nouveau mot de passe pour ton compte.",
      newPassword: "Nouveau mot de passe",
      confirm: "Confirmer",
      resetting: "Réinitialisation...",
      resetAction: "Réinitialiser",
      invalidLink: "Lien invalide",
      backToLogin: "Retour à la connexion",
      resetDone: "Mot de passe réinitialisé",
      resetDoneDesc: "Tu peux maintenant te connecter avec ton nouveau mot de passe.",
      signIn: "Se connecter",
      rules: {
        minLength: "Minimum 8 caractères",
        uppercase: "Une lettre majuscule",
        lowercase: "Une lettre minuscule",
        digit: "Un chiffre",
        special: "Un caractère spécial (!@#$...)",
      },
      errors: {
        minLength: "Minimum 8 caractères",
        uppercase: "Doit contenir une majuscule",
        lowercase: "Doit contenir une minuscule",
        digit: "Doit contenir un chiffre",
        special: "Doit contenir un caractère spécial",
        confirmRequired: "Confirme ton mot de passe",
        mismatch: "Les mots de passe ne correspondent pas",
        generic: "Erreur",
      },
    },
    verifyEmailPending: {
      title: "Confirme ton courriel",
      subtitle: "On a envoyé un lien de confirmation à {email}. Clique sur le lien pour activer ton compte.",
      iVerified: "J'ai confirmé, continuer",
      checking: "Vérification...",
      stillNotVerified: "Ton courriel n'est pas encore confirmé.",
      resendSuccess: "Courriel renvoyé avec succès",
      noEmailReceived: "Tu ne reçois rien ? Vérifie tes indésirables ou",
      retryIn: "Réessayer dans {time}",
      sending: "Envoi...",
      retry: "réessaie",
      logout: "Se déconnecter",
      errorGeneric: "Erreur",
    },
    verifyEmail: {
      verifying: "Confirmation de ton courriel...",
      success: "Courriel confirmé !",
      redirecting: "Redirection...",
      invalidLink: "Lien invalide",
      errorGeneric: "Erreur",
      backToLogin: "Retour à la connexion",
    },
  },
};

export default fr;
