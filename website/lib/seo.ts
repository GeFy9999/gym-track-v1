import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/dictionaries";

export const SITE_URL = "https://gymstrack.app";

// The public pages worth indexing, by path after the locale ("" = home).
// Login, signup and password pages aren't listed: robots.txt keeps crawlers
// out of them.
export const INDEXED_PAGES = ["", "/contact", "/privacy", "/terms", "/legal"] as const;
export type IndexedPage = (typeof INDEXED_PAGES)[number];

const PAGE_TITLES: Record<Exclude<IndexedPage, "">, Record<Locale, string>> = {
  "/contact": { fr: "Contacter le support", en: "Contact support" },
  "/privacy": { fr: "Politique de confidentialité", en: "Privacy policy" },
  "/terms": { fr: "Conditions d'utilisation", en: "Terms of Service" },
  "/legal": { fr: "Mentions légales", en: "Legal notice" },
};

// hreflang links between the French and English version of the same page,
// with French (the default the site redirects to) as x-default.
export function languageAlternates(page: IndexedPage) {
  return {
    ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${page}`])),
    "x-default": `${SITE_URL}/${defaultLocale}${page}`,
  };
}

// Per-page metadata: its own canonical URL and language alternates (instead
// of every page pointing at the home page), plus a title for sub-pages.
// No openGraph here: Next replaces the layout's whole openGraph object
// rather than merging it, which would drop the share title/description.
export function pageMetadata(locale: Locale, page: IndexedPage): Metadata {
  return {
    ...(page ? { title: `${PAGE_TITLES[page][locale]} | GymsTrack` } : {}),
    alternates: {
      canonical: `${SITE_URL}/${locale}${page}`,
      languages: languageAlternates(page),
    },
  };
}
