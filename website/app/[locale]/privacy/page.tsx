import { notFound } from "next/navigation";
import Link from "next/link";
import LegalLayout from "@/components/LegalLayout";
import { getDictionary, locales, type Locale } from "@/dictionaries";
import {
  PRIVACY_CONTENT,
  PRIVACY_LAST_UPDATED,
  type Segment,
} from "@/lib/privacyContent";

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <LegalLayout dict={dict} locale={locale as Locale}>
      <Content lang={locale === "fr" ? "fr" : "en"} />
    </LegalLayout>
  );
}

// Same text as the app's privacy page (lib/privacyContent.ts). Links to app
// routes (e.g. /account-deletion) point to the web app.
function Text({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <span key={i}>{seg}</span>
        ) : (
          <a
            key={i}
            href={
              seg.href.startsWith("/")
                ? `https://gymstrack.com${seg.href}`
                : seg.href
            }
          >
            {seg.label}
          </a>
        ),
      )}
    </>
  );
}

function Content({ lang }: { lang: "fr" | "en" }) {
  const c = PRIVACY_CONTENT[lang];
  return (
    <>
      <div>
        <h1>{c.title}</h1>
        <p className="text-sm text-[#191714]/40 mt-1">
          {c.updatedLabel} {PRIVACY_LAST_UPDATED}
        </p>
      </div>

      <p>
        <Text segments={c.intro} />
      </p>

      {c.sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2>{section.title}</h2>
          {section.lead && (
            <p>
              <Text segments={section.lead} />
            </p>
          )}
          {section.items && (
            <ul>
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

      <p className="text-sm text-[#191714]/40 pt-4">
        © {new Date().getFullYear()} GymsTrack ·{" "}
        <Link href={`/${lang}/legal`}>
          {lang === "fr" ? "Mentions légales" : "Legal notice"}
        </Link>
      </p>
    </>
  );
}
