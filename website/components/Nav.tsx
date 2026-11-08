import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/dictionaries";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";

type Props = {
  dict: Dictionary["nav"];
  locale: Locale;
};

export default function Nav({ dict, locale }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[#191714]">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
        <Link href={`/${locale}`}>
          <Image
            src="/logo.webp"
            alt="GymsTrack"
            width={158}
            height={60}
            className="w-[116px] h-11 sm:w-[158px] sm:h-[60px]"
          />
        </Link>

        {/* Centred on the whole bar, not on the space left between the logo
            and the right-hand block (which aren't the same width). */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-semibold text-white/70">
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

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={`/${locale}/login`}
            className="hidden md:block text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            {dict.login}
          </Link>
          <LanguageSwitcher locale={locale} />
          <MobileMenu dict={dict} locale={locale} />
        </div>
      </div>
    </header>
  );
}
