import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield } from "lucide-react";
import {
  PRIVACY_CONTENT,
  PRIVACY_LAST_UPDATED,
  type Segment,
} from "../legal/privacyContent";

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

      <PrivacyContent lang={isFrench ? "fr" : "en"} />
    </div>
  );
}

function Text({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <span key={i}>{seg}</span>
        ) : seg.href.startsWith("/") ? (
          <Link key={i} to={seg.href} className="text-[#c9552c] font-bold">
            {seg.label}
          </Link>
        ) : (
          <a key={i} href={seg.href} className="text-[#c9552c] underline">
            {seg.label}
          </a>
        ),
      )}
    </>
  );
}

function PrivacyContent({ lang }: { lang: "fr" | "en" }) {
  const c = PRIVACY_CONTENT[lang];
  return (
    <div className="max-w-2xl text-gray-700 text-sm leading-relaxed space-y-5">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
          {c.title}
        </h1>
        <p className="text-xs text-gray-400">
          {c.updatedLabel} {PRIVACY_LAST_UPDATED}
        </p>
      </div>

      <p>
        <Text segments={c.intro} />
      </p>

      {c.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="font-bold text-gray-900 mb-1">{section.title}</h2>
          {section.lead && (
            <p>
              <Text segments={section.lead} />
            </p>
          )}
          {section.items && (
            <ul className="list-disc pl-5 space-y-1">
              {section.items.map((item, i) => (
                <li key={i}>
                  <Text segments={item} />
                </li>
              ))}
            </ul>
          )}
          {section.paragraphs?.map((para, i) => (
            <p key={i}>
              <Text segments={para} />
            </p>
          ))}
        </section>
      ))}

      <p className="text-xs text-gray-400 pt-4">
        © 2026 GymsTrack ·{" "}
        <Link to="/legal" className="underline">
          {lang === "fr" ? "Mentions légales" : "Legal notice"}
        </Link>
      </p>
    </div>
  );
}
