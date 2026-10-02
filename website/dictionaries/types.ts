export type Dictionary = {
  nav: {
    features: string;
    pricing: string;
    faq: string;
  };
  hero: {
    title: [string, string];
    subtitle: string;
  };
  demos: {
    eyebrow: string;
    title: string;
    subtitle: string;
    free: { label: string; description: string };
    pro: { label: string; description: string };
    comingSoon: string;
  };
  phoneMock: {
    thisWeek: string;
    completed: string;
    backBiceps: string;
    exercises: string;
    benchPress: string;
    weeklyGain: string;
    currentStreak: string;
    streakWeeks: string;
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    subtitle: string;
    plans: {
      name: string;
      price: string;
      period: string;
      note: string;
      highlight: boolean;
    }[];
    mostPopular: string;
    loyalty: {
      title: string;
      subtitle: string;
      monthly: string;
      annual: string;
    };
  };
  comparison: {
    badge: string;
    title: string;
    columns: { free: string; pro: string; lifetime: string };
    rows: { label: string; free: string | boolean; pro: boolean; lifetime: boolean }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  footer: {
    privacy: string;
    terms: string;
    legal: string;
    rights: string;
  };
  meta: {
    title: string;
    description: string;
  };
};

export type Locale = "fr" | "en";
export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";
