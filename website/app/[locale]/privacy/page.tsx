import { notFound } from "next/navigation";
import Link from "next/link";
import LegalLayout from "@/components/LegalLayout";
import { getDictionary, locales, type Locale } from "@/dictionaries";

const LAST_UPDATED = "2026-09-27";

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
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
        <h1>Politique de confidentialité</h1>
        <p className="text-sm text-[#191714]/40 mt-1">
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <p>
        GymsTrack (« nous », « notre ») respecte ta vie privée. Cette
        politique explique quelles données nous collectons dans
        l&apos;application GymsTrack (web, Android, iOS), pourquoi, et
        comment tu peux les contrôler.
      </p>

      <section>
        <h2>Données que nous collectons</h2>
        <ul>
          <li>
            Informations de compte : nom, adresse courriel, mot de passe
            (chiffré) ou compte Google associé
          </li>
          <li>
            Données d&apos;entraînement : séances, exercices, séries, poids
            soulevé, répétitions, groupes musculaires suivis
          </li>
          <li>Poids corporel, si tu choisis de le suivre</li>
          <li>Photos de progression, si tu choisis d&apos;en ajouter</li>
          <li>Notes personnelles sur les exercices</li>
          <li>Préférences (unité de poids, langue, minuteur de repos)</li>
          <li>
            Informations d&apos;abonnement (statut Pro, dates de
            renouvellement) si tu souscris à GymsTrack Pro
          </li>
        </ul>
      </section>

      <section>
        <h2>Services tiers utilisés</h2>
        <ul>
          <li>
            <strong>Google</strong> — pour la connexion via ton compte Google
            (optionnel)
          </li>
          <li>
            <strong>Stripe</strong> — pour le traitement des paiements de
            l&apos;abonnement Pro. Nous ne stockons jamais tes informations de
            carte bancaire ; Stripe les traite directement
          </li>
          <li>
            <strong>Resend</strong> — pour l&apos;envoi de courriels
            transactionnels (réinitialisation de mot de passe)
          </li>
        </ul>
      </section>

      <section>
        <h2>Comment nous utilisons tes données</h2>
        <p>
          Tes données servent uniquement à faire fonctionner
          l&apos;application : suivre tes entraînements, afficher tes
          progrès, gérer ton compte et ton abonnement. Nous ne vendons
          jamais tes données à des tiers.
        </p>
      </section>

      <section>
        <h2>Suppression de ton compte</h2>
        <p>
          Tu peux supprimer ton compte et toutes les données associées à
          tout moment, directement dans l&apos;application (Profil → Zone de
          danger → Supprimer le compte), ou sans installer
          l&apos;application via{" "}
          <a href="https://gymstrack.com/account-deletion">cette page web</a>
          . Cette action est définitive et immédiate.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Les mots de passe sont chiffrés, les communications sont chiffrées
          (HTTPS), et l&apos;accès à tes données est protégé par
          authentification.
        </p>
      </section>

      <section>
        <h2>Nous contacter</h2>
        <p>
          Pour toute question concernant tes données ou cette politique,
          écris-nous à{" "}
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
        <h1>Privacy Policy</h1>
        <p className="text-sm text-[#191714]/40 mt-1">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <p>
        GymsTrack (&quot;we&quot;, &quot;our&quot;) respects your privacy.
        This policy explains what data we collect in the GymsTrack app (web,
        Android, iOS), why, and how you can control it.
      </p>

      <section>
        <h2>Data we collect</h2>
        <ul>
          <li>
            Account information: name, email address, password (encrypted),
            or a linked Google account
          </li>
          <li>
            Workout data: sessions, exercises, sets, weight lifted, reps,
            tracked muscle groups
          </li>
          <li>Body weight, if you choose to track it</li>
          <li>Progress photos, if you choose to add any</li>
          <li>Personal exercise notes</li>
          <li>Preferences (weight unit, language, rest timer)</li>
          <li>
            Subscription information (Pro status, renewal dates) if you
            subscribe to GymsTrack Pro
          </li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <ul>
          <li>
            <strong>Google</strong> — for signing in with your Google account
            (optional)
          </li>
          <li>
            <strong>Stripe</strong> — for processing Pro subscription
            payments. We never store your card details; Stripe handles them
            directly
          </li>
          <li>
            <strong>Resend</strong> — for sending transactional emails
            (password reset)
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use your data</h2>
        <p>
          Your data is used solely to operate the app: tracking your
          workouts, showing your progress, and managing your account and
          subscription. We never sell your data to third parties.
        </p>
      </section>

      <section>
        <h2>Deleting your account</h2>
        <p>
          You can delete your account and all associated data at any time,
          directly in the app (Profile → Danger Zone → Delete account), or
          without installing the app via{" "}
          <a href="https://gymstrack.com/account-deletion">this web page</a>.
          This action is immediate and permanent.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Passwords are encrypted, communications are encrypted (HTTPS), and
          access to your data is protected by authentication.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          For any questions about your data or this policy, email us at{" "}
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
