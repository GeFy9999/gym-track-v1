import type { MetadataRoute } from "next";
import { locales } from "@/dictionaries";
import { INDEXED_PAGES, SITE_URL, languageAlternates } from "@/lib/seo";

// /sitemap.xml — every indexed page in each language, each entry listing its
// translations so Google treats /fr/… and /en/… as one page in two languages.
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${page}`,
      changeFrequency: page === "" ? ("weekly" as const) : ("yearly" as const),
      priority: page === "" ? 1 : 0.3,
      alternates: { languages: languageAlternates(page) },
    })),
  );
}
