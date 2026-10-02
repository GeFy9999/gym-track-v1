import type { Locale } from "./types";
import fr from "./fr";
import en from "./en";

const dictionaries = { fr, en };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export * from "./types";
