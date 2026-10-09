// Privacy policy text, shared word for word by the app (frontend) and the
// marketing site (website/lib/privacyContent.ts and
// frontend/src/legal/privacyContent.ts — keep both copies identical).
// Written to cover Quebec's Law 25, Canada's PIPEDA, the EU/UK GDPR and the
// California CCPA for a small app with no ads and no tracking.

export const PRIVACY_LAST_UPDATED = "2026-10-09";

// A piece of text, or a link inside it. Links starting with "/" are app
// routes; the site turns them into https://gymstrack.com links.
export type Segment = string | { href: string; label: string };
export type PrivacySection = {
  title: string;
  // Shown before the list (paragraphs come after it).
  lead?: Segment[];
  paragraphs?: Segment[][];
  items?: Segment[][];
};
export type PrivacyContent = {
  title: string;
  updatedLabel: string;
  intro: Segment[];
  sections: PrivacySection[];
};

const SUPPORT = { href: "mailto:support@gymstrack.com", label: "support@gymstrack.com" };

export const PRIVACY_CONTENT: Record<"fr" | "en", PrivacyContent> = {
  fr: {
    title: "Politique de confidentialité",
    updatedLabel: "Dernière mise à jour :",
    intro: [
      "GymsTrack est édité par Zachary Belley, entrepreneur individuel, 12 Rue du Progrès #1, Gatineau (Québec) J8M 1T1, Canada, qui est responsable de tes renseignements personnels. Cette politique explique quelles données nous collectons dans l'application GymsTrack (web et Android) et sur nos sites, pourquoi, avec qui elles sont partagées et comment tu peux les contrôler.",
    ],
    sections: [
      {
        title: "Responsable de la protection des renseignements personnels",
        paragraphs: [
          ["Zachary Belley, propriétaire de GymsTrack. Pour toute question ou demande concernant tes données : ", SUPPORT, "."],
        ],
      },
      {
        title: "Données que nous collectons",
        items: [
          ["Compte : nom, adresse courriel, mot de passe (stocké chiffré, jamais en clair) ou compte Google associé, langue et préférences (unité de poids, minuteur de repos)."],
          ["Entraînement : séances, exercices, séries, charges, répétitions, notes personnelles et exercices personnalisés."],
          ["Poids corporel et photos de progression, seulement si tu choisis de les ajouter."],
          ["Abonnement : statut Pro, formule, dates de renouvellement, historique de fidélité et identifiants d'achat (Stripe ou Google Play). Nous ne voyons jamais ton numéro de carte."],
          ["Formulaire de contact : nom, courriel et message que tu nous envoies."],
          ["Données techniques : adresse IP et informations de requête, traitées par notre serveur pour la sécurité (par exemple limiter les abus), sans profilage."],
        ],
        paragraphs: [
          ["Nous ne collectons pas ta localisation ni tes contacts, n'affichons aucune publicité et n'utilisons aucun outil de suivi, de statistiques ou d'enregistrement de session."],
        ],
      },
      {
        title: "Données sensibles",
        paragraphs: [
          ["Le poids corporel et les photos de progression peuvent être considérés comme des données sensibles (liées à la santé). Ils sont facultatifs, ajoutés uniquement par toi, visibles seulement par toi et utilisés uniquement pour t'afficher ta progression. Les ajouter vaut consentement explicite ; tu peux le retirer à tout moment en les supprimant dans l'app."],
        ],
      },
      {
        title: "Pourquoi nous les utilisons (et sur quelle base)",
        items: [
          ["Faire fonctionner l'app et ton compte, et fournir l'abonnement Pro — exécution du contrat."],
          ["Poids corporel, photos et connexion avec Google — ton consentement."],
          ["Sécurité, prévention de la fraude et des abus, et rappels liés à ton abonnement (par exemple activer ta réduction de fidélité) — notre intérêt légitime. Chaque rappel contient un lien de désabonnement."],
          ["Facturation et taxes — nos obligations légales."],
        ],
        paragraphs: [
          ["Nous ne vendons, ne louons et ne partageons jamais tes données à des fins publicitaires. Nous ne t'enverrons aucun courriel promotionnel sans ton consentement exprès."],
        ],
      },
      {
        title: "Où sont tes données et avec qui elles sont partagées",
        lead: ["Tes données sont hébergées sur notre propre serveur, situé au Québec (Canada). Nous faisons appel aux prestataires suivants, seulement pour ce qui est nécessaire :"],
        items: [
          ["Google (États-Unis) — connexion avec ton compte Google, si tu la choisis."],
          ["Google Play et RevenueCat (États-Unis) — paiement et gestion des abonnements sur Android (identifiant de compte GymsTrack et historique d'achats)."],
          ["Stripe (États-Unis, Canada) — paiement des abonnements sur le web."],
          ["Resend (États-Unis) — envoi des courriels (vérification, mot de passe, rappels, formulaire de contact)."],
          ["Cloudflare (international) — DNS, protection du réseau et réception des courriels envoyés à support@."],
        ],
      },
      {
        title: "Transferts hors du Québec, du Canada ou de l'Union européenne",
        paragraphs: [
          ["Certains prestataires traitent des données aux États-Unis. Ces transferts sont encadrés par leurs engagements contractuels (notamment les clauses contractuelles types de la Commission européenne et le Data Privacy Framework UE–États-Unis) et ont été évalués conformément à la Loi 25 du Québec. Tu peux nous demander plus d'information sur ces garanties."],
        ],
      },
      {
        title: "Combien de temps nous les gardons",
        items: [
          ["Données du compte et d'entraînement : tant que ton compte existe. Elles sont supprimées immédiatement quand tu supprimes ton compte ; les copies de sauvegarde éventuelles sont effacées dans un délai de 30 jours."],
          ["Messages de contact : le temps de traiter ta demande, au plus 24 mois."],
          ["Données de paiement : conservées par Stripe ou Google selon leurs obligations fiscales et comptables."],
        ],
      },
      {
        title: "Tes droits",
        paragraphs: [
          ["Où que tu vives, tu peux nous demander gratuitement d'accéder à tes données, de les corriger, de les supprimer, d'en recevoir une copie dans un format structuré et couramment utilisé (portabilité), de retirer ton consentement, ou de t'opposer à un traitement ou de le limiter. L'export CSV intégré à l'app est une fonctionnalité Pro, mais une copie complète de tes données reste gratuite sur simple demande à ", SUPPORT, ". Nous répondons dans un délai de 30 jours."],
          ["Tu peux aussi porter plainte auprès d'une autorité : la Commission d'accès à l'information du Québec, le Commissariat à la protection de la vie privée du Canada, ou l'autorité de protection des données de ton pays (par exemple la CNIL en France)."],
        ],
      },
      {
        title: "Suppression de ton compte",
        paragraphs: [
          ["Tu peux supprimer ton compte et toutes les données associées à tout moment dans l'application (Profil → Zone de danger → Supprimer le compte), ou sans l'application via ", { href: "/account-deletion", label: "cette page web" }, ". Cette action est définitive et immédiate. Pense à annuler aussi ton abonnement dans Google Play si tu en as un."],
        ],
      },
      {
        title: "Témoins (cookies) et stockage local",
        paragraphs: [
          ["Nous n'utilisons aucun témoin publicitaire ou de statistiques. L'app enregistre seulement sur ton appareil ce qui est nécessaire à son fonctionnement (ta session de connexion, tes préférences et tes séances en attente de synchronisation hors ligne). Ces éléments sont strictement nécessaires et ne servent jamais à te suivre."],
        ],
      },
      {
        title: "Âge minimum",
        paragraphs: [
          ["GymsTrack s'adresse aux personnes de 16 ans et plus. Si nous apprenons qu'un compte appartient à une personne plus jeune, nous le supprimons."],
        ],
      },
      {
        title: "Sécurité et incidents",
        paragraphs: [
          ["Les mots de passe sont chiffrés, toutes les communications passent par HTTPS et l'accès à tes données est protégé par authentification. En cas d'incident de confidentialité présentant un risque, nous avisons les autorités concernées et les personnes touchées comme la loi l'exige."],
        ],
      },
      {
        title: "Modifications",
        paragraphs: [
          ["Nous pouvons mettre à jour cette politique. La date en haut de la page indique la version en vigueur ; en cas de changement important, nous t'en informerons dans l'app ou par courriel."],
        ],
      },
      {
        title: "Nous contacter",
        paragraphs: [["Pour toute question concernant tes données ou cette politique : ", SUPPORT, "."]],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updatedLabel: "Last updated:",
    intro: [
      "GymsTrack is published by Zachary Belley, sole proprietor, 12 Rue du Progrès #1, Gatineau (Quebec) J8M 1T1, Canada, who is responsible for your personal information (data controller). This policy explains what data we collect in the GymsTrack app (web and Android) and on our websites, why, who it is shared with, and how you can control it.",
    ],
    sections: [
      {
        title: "Person in charge of the protection of personal information",
        paragraphs: [
          ["Zachary Belley, owner of GymsTrack. For any question or request about your data: ", SUPPORT, "."],
        ],
      },
      {
        title: "Data we collect",
        items: [
          ["Account: name, email address, password (stored encrypted, never in plain text) or linked Google account, language and preferences (weight unit, rest timer)."],
          ["Training: sessions, exercises, sets, loads, reps, personal notes and custom exercises."],
          ["Body weight and progress photos, only if you choose to add them."],
          ["Subscription: Pro status, plan, renewal dates, loyalty history and purchase identifiers (Stripe or Google Play). We never see your card number."],
          ["Contact form: the name, email and message you send us."],
          ["Technical data: IP address and request information, processed by our server for security (for example to limit abuse), without profiling."],
        ],
        paragraphs: [
          ["We do not collect your location or contacts, show no ads, and use no tracking, analytics or session-recording tools."],
        ],
      },
      {
        title: "Sensitive data",
        paragraphs: [
          ["Body weight and progress photos may be considered sensitive (health-related) data. They are optional, added only by you, visible only to you, and used only to show you your progress. Adding them is your explicit consent; you can withdraw it at any time by deleting them in the app."],
        ],
      },
      {
        title: "Why we use it (and on what basis)",
        items: [
          ["Running the app and your account, and providing the Pro subscription — performance of the contract."],
          ["Body weight, photos and signing in with Google — your consent."],
          ["Security, fraud and abuse prevention, and reminders about your subscription (for example activating your loyalty discount) — our legitimate interest. Every reminder includes an unsubscribe link."],
          ["Billing and taxes — our legal obligations."],
        ],
        paragraphs: [
          ["We never sell, rent or share your data for advertising (including \"sale\" or \"sharing\" as defined by California law). We will not send you promotional emails without your express consent."],
        ],
      },
      {
        title: "Where your data is and who it is shared with",
        lead: ["Your data is hosted on our own server, located in Quebec (Canada). We use the following providers, only for what is necessary:"],
        items: [
          ["Google (United States) — signing in with your Google account, if you choose to."],
          ["Google Play and RevenueCat (United States) — payment and subscription management on Android (GymsTrack account identifier and purchase history)."],
          ["Stripe (United States, Canada) — subscription payments on the web."],
          ["Resend (United States) — sending emails (verification, password, reminders, contact form)."],
          ["Cloudflare (international) — DNS, network protection and receiving emails sent to support@."],
        ],
      },
      {
        title: "Transfers outside Quebec, Canada or the European Union",
        paragraphs: [
          ["Some providers process data in the United States. These transfers are covered by their contractual commitments (including the European Commission's Standard Contractual Clauses and the EU–US Data Privacy Framework) and were assessed in accordance with Quebec's Law 25. You can ask us for more information about these safeguards."],
        ],
      },
      {
        title: "How long we keep it",
        items: [
          ["Account and training data: as long as your account exists. It is deleted immediately when you delete your account; any backup copies are erased within 30 days."],
          ["Contact messages: as long as needed to handle your request, at most 24 months."],
          ["Payment data: kept by Stripe or Google according to their tax and accounting obligations."],
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          ["Wherever you live, you can ask us, free of charge, to access your data, correct it, delete it, receive a copy in a structured, commonly used format (portability), withdraw your consent, or object to or restrict processing. The CSV export built into the app is a Pro feature, but a full copy of your data is always free on request at ", SUPPORT, ". We reply within 30 days."],
          ["You can also complain to a regulator: Quebec's Commission d'accès à l'information, the Office of the Privacy Commissioner of Canada, or the data protection authority of your country (for example in the EU or UK)."],
        ],
      },
      {
        title: "Deleting your account",
        paragraphs: [
          ["You can delete your account and all associated data at any time in the app (Profile → Danger zone → Delete account), or without the app via ", { href: "/account-deletion", label: "this web page" }, ". This is permanent and immediate. Remember to also cancel your Google Play subscription if you have one."],
        ],
      },
      {
        title: "Cookies and local storage",
        paragraphs: [
          ["We use no advertising or analytics cookies. The app only stores on your device what it needs to work (your login session, your preferences and sessions waiting to sync while offline). These are strictly necessary and never used to track you."],
        ],
      },
      {
        title: "Minimum age",
        paragraphs: [
          ["GymsTrack is intended for people aged 16 and over. If we learn that an account belongs to someone younger, we delete it."],
        ],
      },
      {
        title: "Security and incidents",
        paragraphs: [
          ["Passwords are encrypted, all communication goes through HTTPS, and access to your data requires authentication. If a privacy incident creates a risk, we notify the relevant authorities and affected people as required by law."],
        ],
      },
      {
        title: "Changes",
        paragraphs: [
          ["We may update this policy. The date at the top shows the current version; for significant changes, we will let you know in the app or by email."],
        ],
      },
      {
        title: "Contact us",
        paragraphs: [["For any question about your data or this policy: ", SUPPORT, "."]],
      },
    ],
  },
};
