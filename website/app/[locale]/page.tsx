import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import Demos from "@/components/Demos";
import FeatureComparison from "@/components/FeatureComparison";
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
        <Hero dict={dict.hero} locale={locale as Locale} />
        <Features dict={dict.features} />
        <About dict={dict.about} phoneDict={dict.phoneMock} />
        <Demos dict={dict.demos} phoneDict={dict.phoneMock} />
        <FeatureComparison
          dict={dict.comparison}
          pricingDict={dict.pricing}
          locale={locale as Locale}
        />
        <Faq dict={dict.faq} />
      </main>
      <Footer dict={dict.footer} locale={locale as Locale} />
    </>
  );
}
