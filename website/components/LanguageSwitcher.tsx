"use client";

import Link from "next/link";
import type { Locale } from "@/dictionaries";

type Props = {
  locale: Locale;
};

// A plain <Link> would navigate but never remember the choice — the proxy
// would just re-detect from Accept-Language on the next visit to "/". This
// sets the same cookie the proxy reads, so a manual pick sticks afterward.
export default function LanguageSwitcher({ locale }: Props) {
  const remember = (next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
  };

  return (
    <div className="flex items-center text-xs font-bold text-[#191714]/40">
      <Link
        href="/fr"
        onClick={() => remember("fr")}
        className={locale === "fr" ? "text-[#191714]" : "hover:text-[#191714] transition-colors"}
      >
        FR
      </Link>
      <span className="mx-1.5">/</span>
      <Link
        href="/en"
        onClick={() => remember("en")}
        className={locale === "en" ? "text-[#191714]" : "hover:text-[#191714] transition-colors"}
      >
        EN
      </Link>
    </div>
  );
}
