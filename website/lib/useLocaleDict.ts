"use client";

import { useParams } from "next/navigation";
import { getDictionary, defaultLocale, type Locale } from "@/dictionaries";

// getDictionary() is a synchronous object lookup (no async I/O), so client
// components can call it directly instead of needing the server-side
// params-based pattern the page components use.
export function useLocaleDict() {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as Locale) || defaultLocale;
  return { locale, dict: getDictionary(locale) };
}
