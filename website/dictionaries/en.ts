import type { Dictionary } from "./types";

const en: Dictionary = {
  nav: {
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    download: "Download",
  },
  hero: {
    badge: "Free to get started",
    title: ["Track your workouts.", "Progress every week."],
    subtitle:
      "GymsTrack is the strength-training app that keeps your weights, reps, and records in one place — so you can actually see your progress, workout after workout.",
    comingSoon: "Coming soon to",
    appStore: "App Store",
    googlePlay: "Google Play",
    releaseNote: "Launching soon — stay tuned.",
  },
  phoneMock: {
    thisWeek: "This week",
    completed: "workouts completed",
    backBiceps: "Back & Biceps",
    exercises: "6 exercises",
    benchPress: "Bench Press",
    weeklyGain: "+5 lb this week",
    currentStreak: "Current streak",
    streakWeeks: "12 weeks in a row",
  },
  features: {
    eyebrow: "Features",
    title: "Everything you need, nothing you don't",
    subtitle:
      "Built by and for people who train seriously, without the unnecessary complexity.",
    items: [
      {
        title: "Progress charts",
        description:
          "Volume per muscle group, estimated 1RM, rep-range records — see exactly where you're improving.",
      },
      {
        title: "Supersets and warmup sets",
        description:
          "Group your exercises into supersets and let the app calculate your warmup sets automatically.",
      },
      {
        title: "Barbell mode and plate calculator",
        description:
          "Enter the total weight, GymsTrack tells you exactly which plates to load on each side.",
      },
      {
        title: "Body weight and photos",
        description:
          "Track your weight week after week and keep progress photos to see how far you've come.",
      },
      {
        title: "Smart rest timer",
        description:
          "A timer between your sets, with a notification even when the app is in the background.",
      },
      {
        title: "CSV import and export",
        description:
          "Bring your history from another app, or export your data whenever you want. Your data is yours.",
      },
      {
        title: "French and English",
        description:
          "The whole app is available in both languages — switch in one tap from your profile.",
      },
      {
        title: "iOS and Android",
        description:
          "One app, your data synced, no matter which phone you're using.",
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Free to start, Pro when you're ready",
    subtitle:
      "The essentials of workout tracking are free. Pro unlocks the advanced tools for serious training.",
    plans: [
      {
        name: "Monthly",
        price: "$4.99",
        period: "/mo",
        note: "7-day free trial",
        highlight: false,
      },
      {
        name: "Annual",
        price: "$29.99",
        period: "/yr",
        note: "Save 50% vs monthly",
        highlight: true,
      },
      {
        name: "Lifetime",
        price: "$79.99",
        period: " one-time",
        note: "One payment, no subscription",
        highlight: false,
      },
    ],
    mostPopular: "Most popular",
    includedTitle: "Included with Pro",
    includedFeatures: [
      "Unlimited history (beyond 90 days)",
      "Calendar view of your history",
      "CSV export of your workouts",
      "Advanced charts: volume, 1RM, rep-range records",
      "Supersets and automatic warmup sets",
      "Barbell mode and plate calculator",
      "Unlimited progress photos",
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: [
      {
        q: "Is GymsTrack free?",
        a: "Yes. Tracking your workouts, exercises, weights, and reps is free, with no time limit. The Pro subscription unlocks advanced tools like unlimited history, advanced progress charts, and barbell mode.",
      },
      {
        q: "Is my data backed up?",
        a: "Yes, your account and data are saved online — switch phones without losing anything. You can also export your entire history as CSV at any time.",
      },
      {
        q: "Can I cancel my Pro subscription anytime?",
        a: "Yes, directly from your profile in the app. You keep Pro access until the end of your paid period, no commitment.",
      },
      {
        q: "Is the app available in English?",
        a: "Yes, GymsTrack is fully bilingual in French and English — switch languages in one tap from your profile settings.",
      },
    ],
  },
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    legal: "Legal notice",
    rights: "All rights reserved.",
  },
  meta: {
    title: "GymsTrack — Track your workouts, progress every week",
    description:
      "The simple, powerful strength-training app: guided workouts, progress charts, personal records, and progress photos. Available on iOS and Android.",
  },
};

export default en;
