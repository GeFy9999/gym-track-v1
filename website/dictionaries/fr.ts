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
    appStoreSoon: "Bientôt",
  },
  bodyWeight: {
    eyebrow: "Poids corporel",
    title: "Vois ton corps changer, semaine après semaine.",
    body: "GymsTrack te demande ton poids une fois par semaine et trace ta courbe tout seul. Tu vois d'un coup d'œil où tu en es et combien tu as perdu ou pris depuis le début.",
    imageAlt: "Écran Statistiques de GymsTrack avec le graphique du poids corporel",
    points: [
      {
        title: "Une pesée par semaine",
        description:
          "Au début de la semaine, l'app te demande ton poids. Dix secondes, et c'est noté.",
      },
      {
        title: "Ta tendance, pas juste un chiffre",
        description:
          "La courbe montre ta direction et le total gagné ou perdu, pour garder le cap en bulk comme en sèche.",
      },
      {
        title: "En lb ou en kg",
        description:
          "Choisis ton unité dans les paramètres : le graphique et toute l'app s'adaptent.",
      },
    ],
  },
  demos: {
    badge: "Pro",
    eyebrow: "Mode barre",
    title: "Entre tes plaques. L'app fait le calcul.",
    body: "Plus besoin d'additionner dans ta tête : tu entres ce que tu mets de chaque côté et GymsTrack calcule le total, barre comprise. La saisie s'adapte aussi à l'équipement de chaque exercice.",
    videoLabel: "Vidéo du mode barre de GymsTrack : choix de la barre, poids par côté et total calculé",
    points: [
      {
        title: "Choisis ta barre",
        description:
          "45, 35 ou 15 lb : le poids de la barre est compté automatiquement dans le total.",
      },
      {
        title: "Poids par côté, total calculé",
        description:
          "Entre 25 lb par côté, l'app affiche les plaques à charger et le total de 95 lb.",
      },
      {
        title: "Selon l'équipement",
        description:
          "Barre, machine à plaques ou poulie : chaque exercice garde sa façon de se charger.",
      },
    ],
    alsoInPro: "Aussi dans Pro : supersets, échauffement auto, graphiques avancés, historique illimité et plus.",
    cta: "Voir les forfaits Pro",
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
          "Toute l'app est disponible dans les deux langues, change en un clic dans tes paramètres.",
      },
      {
        title: "iOS et Android",
        description:
          "Une seule app, tes données synchronisées, peu importe le téléphone que tu utilises.",
      },
    ],
  },
  about: {
    eyebrow: "Comment ça marche",
    title: "Tu t'entraînes. L'app suit.",
    body: "Pas besoin de bâtir une routine avant d'entrer au gym. Choisis un groupe musculaire, lance ta séance et ajoute tes exercices au fil de l'entraînement — GymsTrack s'occupe du reste.",
    videoLabel: "Vidéo de l'application GymsTrack pendant une séance",
    points: [
      {
        title: "Une séance lancée en un toucher",
        description:
          "Dos, Jambes, Push… Choisis ta journée et c'est parti, sans rien préparer d'avance.",
      },
      {
        title: "Change d'idée en cours de route",
        description:
          "Machine prise ? Ajoute, retire ou réordonne tes exercices à tout moment, sans jamais être bloqué par un plan figé.",
      },
      {
        title: "Ta progression, automatiquement",
        description:
          "Poids et répétitions sont enregistrés à chaque set, et tes statistiques se mettent à jour toutes seules.",
      },
      {
        title: "Tout sous la main pendant ta séance",
        description:
          "Minuteur de repos, type de set (échauffement, dégressif, à l'échec), note personnelle, démo animée de l'exercice avec le « i » et le trophée pour l'ajouter à ton suivi.",
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
      "Annule à tout moment depuis tes paramètres. Les abonnements se renouvellent automatiquement sauf annulation avant la fin de la période en cours.",
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
        a: "Oui, directement depuis les paramètres de l'app. Tu gardes l'accès Pro jusqu'à la fin de ta période payée, sans engagement.",
      },
      {
        q: "L'app est-elle disponible en anglais ?",
        a: "Oui, GymsTrack est entièrement bilingue français et anglais — change de langue en un clic dans tes paramètres.",
      },
    ],
  },
  footer: {
    privacy: "Confidentialité",
    terms: "Conditions",
    legal: "Mentions légales",
    contact: "Contact",
    rights: "Tous droits réservés.",
  },
  contact: {
    title: "Contacter le support",
    subtitle:
      "Une question, un problème avec l'app ou ton abonnement ? Écris-nous, on te répond par courriel.",
    name: "Nom",
    namePlaceholder: "Ton nom",
    email: "Courriel",
    emailPlaceholder: "ton@courriel.com",
    topic: "Sujet",
    topics: {
      question: "Question",
      bug: "Problème / bug",
      billing: "Abonnement / paiement",
      account: "Compte / suppression",
      feedback: "Suggestion",
      other: "Autre",
    },
    message: "Message",
    messagePlaceholder: "Décris ta question ou ton problème le plus précisément possible.",
    submit: "Envoyer le message",
    sending: "Envoi…",
    successTitle: "Message envoyé !",
    successText: "Merci, on a bien reçu ton message. On te répond à {email} dès que possible.",
    sendAnother: "Envoyer un autre message",
    errors: {
      name: "Indique ton nom.",
      email: "Indique une adresse courriel valide.",
      message: "Ton message doit contenir au moins 10 caractères.",
      generic: "L'envoi a échoué. Réessaie, ou écris-nous directement par courriel.",
    },
    directTitle: "Par courriel",
    directText: "Tu peux aussi nous écrire directement :",
    responseTime: "On répond généralement en moins de 48 h.",
    helpTitle: "Peut-être déjà répondu",
    faqLink: "Questions fréquentes",
    deleteAccountLink: "Supprimer mon compte",
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
      backToLogin: "Retour à la connexion",
      errorGeneric: "Erreur",
    },
    verifyEmail: {
      verifying: "Confirmation de ton courriel...",
      success: "Courriel confirmé !",
      backToApp: "Retourne sur l'application (ou sur la page où tu t'es inscrit) et appuie sur « J'ai confirmé, continuer ».",
      loginHere: "Ou se connecter ici",
      invalidLink: "Lien invalide",
      errorGeneric: "Erreur",
      backToLogin: "Retour à la connexion",
    },
  },
};

export default fr;
