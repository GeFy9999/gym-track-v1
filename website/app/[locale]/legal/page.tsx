import { notFound } from "next/navigation";
import Link from "next/link";
import LegalLayout from "@/components/LegalLayout";
import { getDictionary, locales, type Locale } from "@/dictionaries";

export default async function LegalPage({
  params,
}: PageProps<"/[locale]/legal">) {
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
      <h1>Mentions légales</h1>

      <section>
        <h2>Éditeur</h2>
        <p>
          GymsTrack est édité par Zachary Belley, entrepreneur individuel.
          <br />
          Adresse : 12 Rue du Progrès #1, Gatineau (Québec) J8M 1T1, Canada
          <br />
          Courriel : support@gymstrack.com
          <br />
          Site web : gymstrack.com
        </p>
      </section>

      <section>
        <h2>Directeur de la publication</h2>
        <p>Zachary Belley</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          L&apos;application et le site web GymsTrack sont hébergés sur un
          serveur dédié privé.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Le nom GymsTrack, son logo et l&apos;ensemble des contenus
          (textes, visuels, code source) présents sur l&apos;application et
          le site web sont la propriété exclusive de Zachary Belley, sauf
          mention contraire. Toute reproduction ou représentation, totale
          ou partielle, sans autorisation préalable est interdite.
        </p>
      </section>

      <section>
        <h2>Droit applicable et litiges</h2>
        <p>
          Les présentes mentions légales sont soumises au droit québécois
          et canadien. En cas de litige, et à défaut d&apos;accord amiable,
          les tribunaux compétents de la province de Québec seront seuls
          compétents.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Pour toute question concernant ces mentions légales, écris-nous à{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>.
        </p>
      </section>

      <p className="text-sm text-[#191714]/40">
        Voir aussi la <Link href="/fr/privacy">politique de confidentialité</Link>{" "}
        et les <Link href="/fr/terms">conditions d&apos;utilisation</Link>.
      </p>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <h1>Legal notice</h1>

      <section>
        <h2>Publisher</h2>
        <p>
          GymsTrack is published by Zachary Belley, sole proprietor.
          <br />
          Address: 12 Rue du Progrès #1, Gatineau, Quebec J8M 1T1, Canada
          <br />
          Email: support@gymstrack.com
          <br />
          Website: gymstrack.com
        </p>
      </section>

      <section>
        <h2>Publication director</h2>
        <p>Zachary Belley</p>
      </section>

      <section>
        <h2>Hosting</h2>
        <p>
          The GymsTrack app and website are hosted on a private dedicated
          server.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The GymsTrack name, logo, and all content (text, visuals, source
          code) found on the app and website are the exclusive property of
          Zachary Belley, unless stated otherwise. Any reproduction or
          representation, in whole or in part, without prior authorization
          is prohibited.
        </p>
      </section>

      <section>
        <h2>Governing law and disputes</h2>
        <p>
          This legal notice is governed by Quebec and Canadian law. In the
          event of a dispute, and absent an amicable resolution, the courts
          of the province of Quebec shall have exclusive jurisdiction.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For any question about this legal notice, write to us at{" "}
          <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>.
        </p>
      </section>

      <p className="text-sm text-[#191714]/40">
        See also the <Link href="/en/privacy">privacy policy</Link> and the{" "}
        <Link href="/en/terms">terms of service</Link>.
      </p>
    </>
  );
}
