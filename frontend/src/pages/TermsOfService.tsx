import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText } from "lucide-react";

const LAST_UPDATED = "2026-09-27";

export default function TermsOfServicePage() {
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
        <FileText size={20} className="text-[#c9552c]" />
      </div>

      {isFrench ? <TermsContentFr /> : <TermsContentEn />}
    </div>
  );
}

function TermsContentFr() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Conditions d'utilisation
        </h1>
        <p className="text-xs text-gray-400">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <p>
        En utilisant GymsTrack, tu acceptes les conditions suivantes. Si tu
        n'es pas d'accord, merci de ne pas utiliser l'application.
      </p>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Ton compte</h2>
        <p>
          Tu es responsable de garder tes identifiants confidentiels et de
          l'exactitude des informations que tu fournis. Tu dois avoir au
          moins 16 ans pour créer un compte.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Abonnement GymsTrack Pro
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            L'abonnement Pro (mensuel, annuel, ou paiement unique à vie) donne
            accès à des fonctionnalités additionnelles décrites dans l'app.
          </li>
          <li>
            Les abonnements mensuels et annuels se renouvellent
            automatiquement à la fin de chaque période, sauf annulation
            avant la date de renouvellement.
          </li>
          <li>
            Tu peux annuler à tout moment. L'accès Pro reste actif jusqu'à la
            fin de la période déjà payée — aucun remboursement au prorata
            n'est offert pour une période entamée.
          </li>
          <li>
            Si tu t'abonnes via le site web, le paiement est traité par
            Stripe et géré depuis ton profil GymsTrack. Si tu t'abonnes via
            l'application Android, le paiement est traité par Google Play et
            se gère depuis les paramètres d'abonnement de ton compte Google
            Play.
          </li>
          <li>
            L'achat à vie est un paiement unique, non récurrent, et n'est pas
            remboursable une fois l'accès Pro débloqué, sauf obligation
            légale contraire.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Politique de remboursement
        </h2>
        <p>
          Les paiements par abonnement ne sont pas remboursables pour une
          période déjà entamée. Si tu penses avoir été facturé par erreur,
          écris-nous à{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] underline">
            support@gymstrack.com
          </a>{" "}
          et nous examinerons ta demande. Les achats effectués via Google
          Play sont soumis à la politique de remboursement de Google Play.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Utilisation acceptable</h2>
        <p>
          Tu acceptes de ne pas utiliser GymsTrack à des fins illégales, de ne
          pas tenter d'accéder aux comptes d'autres utilisateurs, et de ne pas
          perturber le fonctionnement du service.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Limitation de responsabilité
        </h2>
        <p>
          GymsTrack est un outil de suivi d'entraînement et ne fournit aucun
          conseil médical ou professionnel. Consulte un professionnel de la
          santé avant d'entreprendre un nouveau programme d'entraînement.
          L'application est fournie "telle quelle", sans garantie d'aucune
          sorte.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Résiliation</h2>
        <p>
          Tu peux supprimer ton compte à tout moment depuis l'application.
          Nous nous réservons le droit de suspendre ou résilier un compte qui
          enfreint ces conditions.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Modifications</h2>
        <p>
          Nous pouvons mettre à jour ces conditions occasionnellement. La date
          de dernière mise à jour en haut de cette page reflète la version
          actuelle.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Nous contacter</h2>
        <p>
          Pour toute question, écris-nous à{" "}
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

function TermsContentEn() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Terms of Service
        </h1>
        <p className="text-xs text-gray-400">Last updated: {LAST_UPDATED}</p>
      </div>

      <p>
        By using GymsTrack, you agree to the following terms. If you don't
        agree, please don't use the app.
      </p>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Your account</h2>
        <p>
          You're responsible for keeping your credentials confidential and
          for the accuracy of the information you provide. You must be at
          least 16 years old to create an account.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">GymsTrack Pro subscription</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            The Pro subscription (monthly, annual, or a one-time lifetime
            payment) unlocks additional features described in the app.
          </li>
          <li>
            Monthly and annual subscriptions renew automatically at the end
            of each period unless cancelled before the renewal date.
          </li>
          <li>
            You can cancel anytime. Pro access stays active until the end of
            the period you already paid for — no prorated refund is given
            for a partially used period.
          </li>
          <li>
            If you subscribe through the website, payment is processed by
            Stripe and managed from your GymsTrack profile. If you subscribe
            through the Android app, payment is processed by Google Play and
            managed from your Google Play account's subscription settings.
          </li>
          <li>
            The lifetime purchase is a one-time, non-recurring payment and is
            non-refundable once Pro access has been unlocked, except where
            required by law.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Refund policy</h2>
        <p>
          Subscription payments are non-refundable for a period already
          underway. If you believe you were charged in error, email us at{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] underline">
            support@gymstrack.com
          </a>{" "}
          and we'll review your request. Purchases made through Google Play
          are subject to Google Play's own refund policy.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Acceptable use</h2>
        <p>
          You agree not to use GymsTrack for unlawful purposes, not to
          attempt to access other users' accounts, and not to disrupt the
          service.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Limitation of liability</h2>
        <p>
          GymsTrack is a workout-tracking tool and does not provide medical
          or professional advice. Consult a healthcare professional before
          starting a new training program. The app is provided "as is",
          without warranties of any kind.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Termination</h2>
        <p>
          You can delete your account at any time from within the app. We
          reserve the right to suspend or terminate an account that violates
          these terms.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Changes</h2>
        <p>
          We may update these terms from time to time. The "last updated"
          date at the top of this page reflects the current version.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Contact us</h2>
        <p>
          For any questions, email us at{" "}
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
