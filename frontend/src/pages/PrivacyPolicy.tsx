import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield } from "lucide-react";

const LAST_UPDATED = "2026-09-27";

export default function PrivacyPolicyPage() {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6 pb-16">
      <Link
        to="/login"
        className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mb-4"
      >
        <ArrowLeft size={16} className="text-gray-700" />
      </Link>

      <div className="text-center mb-6">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-14 mx-auto"
        />
      </div>

      <div className="w-11 h-11 rounded-xl bg-[#c9552c]/10 flex items-center justify-center mb-3">
        <Shield size={20} className="text-[#c9552c]" />
      </div>

      {isFrench ? (
        <PrivacyContentFr />
      ) : (
        <PrivacyContentEn />
      )}
    </div>
  );
}

function PrivacyContentFr() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Politique de confidentialité
        </h1>
        <p className="text-xs text-gray-400">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <p>
        GymsTrack ("nous", "notre") respecte ta vie privée. Cette politique
        explique quelles données nous collectons dans l'application GymsTrack
        (web, Android, iOS), pourquoi, et comment tu peux les contrôler.
      </p>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Données que nous collectons
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Informations de compte : nom, adresse courriel, mot de passe (chiffré) ou compte Google associé</li>
          <li>Données d'entraînement : séances, exercices, séries, poids soulevé, répétitions, groupes musculaires suivis</li>
          <li>Poids corporel, si tu choisis de le suivre</li>
          <li>Photos de progression, si tu choisis d'en ajouter</li>
          <li>Notes personnelles sur les exercices</li>
          <li>Préférences (unité de poids, langue, minuteur de repos)</li>
          <li>Informations d'abonnement (statut Pro, dates de renouvellement) si tu souscris à GymsTrack Pro</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Services tiers utilisés
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Google</strong> — pour la connexion via ton compte Google (optionnel)</li>
          <li><strong>Stripe</strong> — pour le traitement des paiements de l'abonnement Pro. Nous ne stockons jamais tes informations de carte bancaire ; Stripe les traite directement</li>
          <li><strong>Resend</strong> — pour l'envoi de courriels transactionnels (réinitialisation de mot de passe)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Comment nous utilisons tes données
        </h2>
        <p>
          Tes données servent uniquement à faire fonctionner l'application :
          suivre tes entraînements, afficher tes progrès, gérer ton compte et
          ton abonnement. Nous ne vendons jamais tes données à des tiers.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Suppression de ton compte
        </h2>
        <p>
          Tu peux supprimer ton compte et toutes les données associées à tout
          moment, directement dans l'application (Profil → Zone de danger →
          Supprimer le compte), ou sans installer l'application via{" "}
          <Link to="/account-deletion" className="text-[#c9552c] font-bold">
            cette page web
          </Link>
          . Cette action est définitive et immédiate.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Sécurité
        </h2>
        <p>
          Les mots de passe sont chiffrés, les communications sont chiffrées
          (HTTPS), et l'accès à tes données est protégé par authentification.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Nous contacter
        </h2>
        <p>
          Pour toute question concernant tes données ou cette politique,
          écris-nous à{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] underline">
            support@gymstrack.com
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-gray-400 pt-4">
        © 2026 GymsTrack ·{" "}
        <Link to="/legal" className="underline">
          Mentions légales
        </Link>
      </p>
    </div>
  );
}

function PrivacyContentEn() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <p>
        GymsTrack ("we", "our") respects your privacy. This policy explains
        what data we collect in the GymsTrack app (web, Android, iOS), why,
        and how you can control it.
      </p>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Data we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account information: name, email address, password (encrypted), or a linked Google account</li>
          <li>Workout data: sessions, exercises, sets, weight lifted, reps, tracked muscle groups</li>
          <li>Body weight, if you choose to track it</li>
          <li>Progress photos, if you choose to add any</li>
          <li>Personal exercise notes</li>
          <li>Preferences (weight unit, language, rest timer)</li>
          <li>Subscription information (Pro status, renewal dates) if you subscribe to GymsTrack Pro</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Third-party services</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Google</strong> — for signing in with your Google account (optional)</li>
          <li><strong>Stripe</strong> — for processing Pro subscription payments. We never store your card details; Stripe handles them directly</li>
          <li><strong>Resend</strong> — for sending transactional emails (password reset)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          How we use your data
        </h2>
        <p>
          Your data is used solely to operate the app: tracking your
          workouts, showing your progress, and managing your account and
          subscription. We never sell your data to third parties.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Deleting your account</h2>
        <p>
          You can delete your account and all associated data at any time,
          directly in the app (Profile → Danger Zone → Delete account), or
          without installing the app via{" "}
          <Link to="/account-deletion" className="text-[#c9552c] font-bold">
            this web page
          </Link>
          . This action is immediate and permanent.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Security</h2>
        <p>
          Passwords are encrypted, communications are encrypted (HTTPS), and
          access to your data is protected by authentication.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Contact us</h2>
        <p>
          For any questions about your data or this policy, email us at{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] underline">
            support@gymstrack.com
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-gray-400 pt-4">
        © 2026 GymsTrack ·{" "}
        <Link to="/legal" className="underline">
          Legal notice
        </Link>
      </p>
    </div>
  );
}
