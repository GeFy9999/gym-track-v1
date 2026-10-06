import { notFound } from "next/navigation";
import LegalLayout from "@/components/LegalLayout";
import ContactForm from "@/components/ContactForm";
import { getDictionary, locales, type Locale } from "@/dictionaries";

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const t = dict.contact;

  return (
    <LegalLayout dict={dict} locale={locale as Locale}>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>

      <ContactForm dict={t} />

      <section className="grid sm:grid-cols-2 gap-4 not-prose">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2>{t.directTitle}</h2>
          <p className="text-sm">{t.directText}</p>
          <p className="mt-1">
            <a href="mailto:support@gymstrack.com">support@gymstrack.com</a>
          </p>
          <p className="text-xs text-[#191714]/50 mt-2">{t.responseTime}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2>{t.helpTitle}</h2>
          <ul>
            <li>
              <a href={`/${locale}#faq`}>{t.faqLink}</a>
            </li>
            <li>
              <a href="https://gymstrack.com/account-deletion">{t.deleteAccountLink}</a>
            </li>
          </ul>
        </div>
      </section>
    </LegalLayout>
  );
}
