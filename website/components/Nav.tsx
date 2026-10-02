import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = {
  dict: Dictionary["nav"];
  locale: Locale;
};

export default function Nav({ dict, locale }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[#faf6f1]/90 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={`/${locale}`}>
          <Image src="/logo.webp" alt="GymsTrack" width={40} height={40} className="rounded-lg" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#191714]/70">
          <a href="#fonctionnalites" className="hover:text-[#191714] transition-colors">
            {dict.features}
          </a>
          <a href="#tarifs" className="hover:text-[#191714] transition-colors">
            {dict.pricing}
          </a>
          <a href="#faq" className="hover:text-[#191714] transition-colors">
            {dict.faq}
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />

          <a
            href="#telecharger"
            className="bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide px-5 py-2.5 rounded-full shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {dict.download}
          </a>
        </div>
      </div>
    </header>
  );
}
