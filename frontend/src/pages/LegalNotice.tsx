import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Scale } from "lucide-react";

export default function LegalNoticePage() {
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
        <Scale size={20} className="text-[#c9552c]" />
      </div>

      {isFrench ? <LegalContentFr /> : <LegalContentEn />}
    </div>
  );
}

function LegalContentFr() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Mentions légales
        </h1>
      </div>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Éditeur</h2>
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
        <h2 className="font-bold text-gray-900 mb-1">
          Directeur de la publication
        </h2>
        <p>Zachary Belley</p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Hébergement</h2>
        <p>
          L'application et le site web GymsTrack sont hébergés sur un serveur
          dédié privé.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Propriété intellectuelle
        </h2>
        <p>
          Le nom GymsTrack, son logo et l'ensemble des contenus (textes,
          visuels, code source) présents sur l'application et le site web
          sont la propriété exclusive de Zachary Belley, sauf mention
          contraire. Toute reproduction ou représentation, totale ou
          partielle, sans autorisation préalable est interdite.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Droit applicable et litiges
        </h2>
        <p>
          Les présentes mentions légales sont soumises au droit québécois et
          canadien. En cas de litige, et à défaut d'accord amiable, les
          tribunaux compétents de la province de Québec seront seuls
          compétents.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Contact</h2>
        <p>
          Pour toute question concernant ces mentions légales, écris-nous à{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] font-bold">
            support@gymstrack.com
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-gray-400">
        Voir aussi la{" "}
        <Link to="/privacy" className="text-[#c9552c] font-bold">
          politique de confidentialité
        </Link>{" "}
        et les{" "}
        <Link to="/terms" className="text-[#c9552c] font-bold">
          conditions d'utilisation
        </Link>
        .
      </p>
    </div>
  );
}

function LegalContentEn() {
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          Legal notice
        </h1>
      </div>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Publisher</h2>
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
        <h2 className="font-bold text-gray-900 mb-1">Publication director</h2>
        <p>Zachary Belley</p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Hosting</h2>
        <p>
          The GymsTrack app and website are hosted on a private dedicated
          server.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Intellectual property</h2>
        <p>
          The GymsTrack name, logo, and all content (text, visuals, source
          code) found on the app and website are the exclusive property of
          Zachary Belley, unless stated otherwise. Any reproduction or
          representation, in whole or in part, without prior authorization is
          prohibited.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">
          Governing law and disputes
        </h2>
        <p>
          This legal notice is governed by Quebec and Canadian law. In the
          event of a dispute, and absent an amicable resolution, the courts
          of the province of Quebec shall have exclusive jurisdiction.
        </p>
      </section>

      <section>
        <h2 className="font-bold text-gray-900 mb-1">Contact</h2>
        <p>
          For any question about this legal notice, write to us at{" "}
          <a href="mailto:support@gymstrack.com" className="text-[#c9552c] font-bold">
            support@gymstrack.com
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-gray-400">
        See also the{" "}
        <Link to="/privacy" className="text-[#c9552c] font-bold">
          privacy policy
        </Link>{" "}
        and the{" "}
        <Link to="/terms" className="text-[#c9552c] font-bold">
          terms of service
        </Link>
        .
      </p>
    </div>
  );
}
