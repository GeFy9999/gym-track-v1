import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import type { Dictionary, Locale } from "@/dictionaries";

type Props = {
  dict: Dictionary;
  locale: Locale;
  children: React.ReactNode;
};

// Shared chrome for the three legal pages (privacy/terms/legal) — full site
// Nav/Footer instead of the narrow in-app header the mobile app uses for
// these, since this is a real page on the marketing site, not an app screen.
export default function LegalLayout({ dict, locale, children }: Props) {
  return (
    <>
      <Nav dict={dict.nav} locale={locale} />
      <main className="flex-1 bg-[#faf6f1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Link
            href={`/${locale}`}
            className="text-xs font-bold text-[#c9552c] uppercase tracking-widest"
          >
            ← GymsTrack
          </Link>
          <div className="mt-6 text-[#191714]/80 text-[15px] leading-relaxed space-y-6 [&_h1]:text-3xl [&_h1]:sm:text-4xl [&_h1]:font-black [&_h1]:text-[#191714] [&_h1]:tracking-tight [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#191714] [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#c9552c] [&_a]:underline [&_a]:font-semibold">
            {children}
          </div>
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
