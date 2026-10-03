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
    <header className="sticky top-0 z-50 bg-[#191714]">
      <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link href={`/${locale}`}>
          <Image src="/logo.webp" alt="GymsTrack" width={68} height={68} className="rounded-xl" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
          <a href="#fonctionnalites" className="hover:text-white transition-colors">
            {dict.features}
          </a>
          <a href="#tarifs" className="hover:text-white transition-colors">
            {dict.pricing}
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            {dict.faq}
          </a>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href={`/${locale}/login`}
            className="hidden sm:block text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            {dict.login}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
