import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import { getDictionary, locales, type Locale } from "@/dictionaries";

export default async function Home({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <>
      <Nav dict={dict.nav} locale={locale as Locale} />
      <main className="flex-1">
        <Hero dict={dict.hero} phoneDict={dict.phoneMock} />
        <Features dict={dict.features} />
        <Pricing dict={dict.pricing} />
        <Faq dict={dict.faq} />
      </main>
      <Footer dict={dict.footer} />
    </>
  );
}
