import { notFound } from "next/navigation";
import Link from "next/link";
import LegalLayout from "@/components/LegalLayout";
import { getDictionary, locales, type Locale } from "@/dictionaries";

const LAST_UPDATED = "2026-10-09";

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <LegalLayout dict={dict} locale={locale as Locale}>
      {locale === "fr" ? <ContentFr /> : <ContentEn />}
    </LegalLayout>
  );
}

function ContentFr() {
  return (
    <>
      <div>
        <h1>Conditions d&apos;utilisation</h1>
        <p className="text-sm text-[#191714]/40 mt-1">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <p>
        En utilisant GymsTrack, tu acceptes les conditions suivantes. Si tu
        n&apos;es pas d&apos;accord, merci de ne pas utiliser
        l&apos;application.
      </p>

      <section>
        <h2>Ton compte</h2>
        <p>
          Tu es responsable de garder tes identifiants confidentiels et de
          l&apos;exactitude des informations que tu fournis. Tu dois avoir
          au moins 16 ans pour créer un compte.
        </p>
      </section>

      <section>
        <h2>Abonnement GymsTrack Pro</h2>
        <ul>
          <li>
            L&apos;abonnement Pro (mensuel, annuel, ou paiement unique à vie)
            donne accès à des fonctionnalités additionnelles décrites dans
            l&apos;app.
          </li>
          <li>
            Les abonnements mensuels et annuels se renouvellent
            automatiquement à la fin de chaque période, sauf annulation
            avant la date de renouvellement.
          </li>
          <li>
            Tu peux annuler à tout moment. L&apos;accès Pro reste actif
            jusqu&apos;à la fin de la période déjà payée — aucun
            remboursement au prorata n&apos;est offert pour une période
            entamée.
          </li>
          <li>
            Si tu t&apos;abonnes via le site web, le paiement est traité par
            Stripe et géré depuis ton profil GymsTrack. Si tu t&apos;abonnes
            via l&apos;application Android, le paiement est traité par
            Google Play et se gère depuis les paramètres d&apos;abonnement de
            ton compte Google Play.
          </li>
          <li>
            L&apos;achat à vie est un paiement unique, non récurrent, et
            n&apos;est pas remboursable une fois l&apos;accès Pro débloqué,
            sauf obligation légale contraire.
          </li>
        </ul>
      </section>

      <section>
        <h2>Politique de remboursement</h2>
        <p>
          Les paiements par abonnement ne sont pas remboursables pour une
          période déjà entamée. Si tu penses avoir été facturé par erreur,
          écris-nous à{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>{" "}
          et nous examinerons ta demande. Les achats effectués via Google
          Play sont soumis à la politique de remboursement de Google Play. Si tu résides dans l&apos;Union européenne ou au Royaume-Uni et que tu t&apos;abonnes sur le web, tu peux te rétracter dans les 14 jours suivant le premier paiement et être remboursé en écrivant à support@gymstrack.com. Rien dans ces conditions ne limite les droits que te garantit la loi de ton pays de résidence.
        </p>
      </section>

      <section>
        <h2>Utilisation acceptable</h2>
        <p>
          Tu acceptes de ne pas utiliser GymsTrack à des fins illégales, de
          ne pas tenter d&apos;accéder aux comptes d&apos;autres
          utilisateurs, et de ne pas perturber le fonctionnement du service.
        </p>
      </section>

      <section>
        <h2>Ton contenu</h2>
        <p>
          Les photos de progression, notes et exercices personnalisés que tu
          ajoutes restent ta propriété et ne sont visibles que par toi. Tu
          nous accordes seulement le droit de les stocker et de te les
          afficher pour faire fonctionner le service. Tu confirmes avoir les
          droits sur ce que tu ajoutes (par exemple, des photos de toi prises
          par toi ou avec permission) et tu acceptes de ne pas ajouter de
          contenu illégal ou qui porte atteinte aux droits d&apos;autrui.
          Nous pouvons retirer un contenu qui enfreint ces conditions.
        </p>
      </section>

      <section>
        <h2>Limitation de responsabilité</h2>
        <p>
          GymsTrack est un outil de suivi d&apos;entraînement et ne fournit
          aucun conseil médical ou professionnel. Consulte un professionnel
          de la santé avant d&apos;entreprendre un nouveau programme
          d&apos;entraînement. L&apos;application est fournie « telle
          quelle », sans garantie d&apos;aucune sorte.
        </p>
      </section>

      <section>
        <h2>Résiliation</h2>
        <p>
          Tu peux supprimer ton compte à tout moment depuis
          l&apos;application. Nous nous réservons le droit de suspendre ou
          résilier un compte qui enfreint ces conditions.
        </p>
      </section>

      <section>
        <h2>Modifications</h2>
        <p>
          Nous pouvons mettre à jour ces conditions occasionnellement. La
          date de dernière mise à jour en haut de cette page reflète la
          version actuelle.
        </p>
      </section>

      <section>
        <h2>Nous contacter</h2>
        <p>
          Pour toute question, écris-nous à{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>.
        </p>
      </section>

      <p className="text-sm text-[#191714]/40 pt-4">
        © {new Date().getFullYear()} GymsTrack ·{" "}
        <Link href="/fr/legal">Mentions légales</Link>
      </p>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <div>
        <h1>Terms of Service</h1>
        <p className="text-sm text-[#191714]/40 mt-1">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <p>
        By using GymsTrack, you agree to the following terms. If you
        don&apos;t agree, please don&apos;t use the app.
      </p>

      <section>
        <h2>Your account</h2>
        <p>
          You&apos;re responsible for keeping your credentials confidential
          and for the accuracy of the information you provide. You must be
          at least 16 years old to create an account.
        </p>
      </section>

      <section>
        <h2>GymsTrack Pro subscription</h2>
        <ul>
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
            managed from your Google Play account&apos;s subscription
            settings.
          </li>
          <li>
            The lifetime purchase is a one-time, non-recurring payment and
            is non-refundable once Pro access has been unlocked, except
            where required by law.
          </li>
        </ul>
      </section>

      <section>
        <h2>Refund policy</h2>
        <p>
          Subscription payments are non-refundable for a period already
          underway. If you believe you were charged in error, email us at{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>{" "}
          and we&apos;ll review your request. Purchases made through Google
          Play are subject to Google Play&apos;s own refund policy. If you live in the European Union or the United Kingdom and subscribe on the web, you may withdraw within 14 days of the first payment and get a refund by emailing support@gymstrack.com. Nothing in these terms limits the rights guaranteed to you by the law of your country of residence.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          You agree not to use GymsTrack for unlawful purposes, not to
          attempt to access other users&apos; accounts, and not to disrupt
          the service.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          The progress photos, notes and custom exercises you add remain
          yours and are visible only to you. You only grant us the right to
          store them and show them back to you to run the service. You
          confirm you have the rights to what you add (for example, photos
          of yourself taken by you or with permission) and agree not to add
          unlawful content or content that infringes anyone else&apos;s
          rights. We may remove content that breaks these terms.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          GymsTrack is a workout-tracking tool and does not provide medical
          or professional advice. Consult a healthcare professional before
          starting a new training program. The app is provided &quot;as
          is&quot;, without warranties of any kind.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You can delete your account at any time from within the app. We
          reserve the right to suspend or terminate an account that
          violates these terms.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. The &quot;last
          updated&quot; date at the top of this page reflects the current
          version.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          For any questions, email us at{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>.
        </p>
      </section>

      <p className="text-sm text-[#191714]/40 pt-4">
        © {new Date().getFullYear()} GymsTrack ·{" "}
        <Link href="/en/legal">Legal notice</Link>
      </p>
    </>
  );
}
