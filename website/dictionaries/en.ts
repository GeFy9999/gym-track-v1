import type { Dictionary } from "./types";

const en: Dictionary = {
  nav: {
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
  },
  hero: {
    title: ["Lift more.", "Guess less."],
    subtitle:
      "GymsTrack is the strength-training app that keeps your weights, reps, and records in one place — so you can actually see your progress, workout after workout.",
  },
  demos: {
    eyebrow: "In action",
    title: "See GymsTrack in action",
    subtitle: "From basic tracking to Pro's advanced tools.",
    free: {
      label: "Free version",
      description: "Workout, exercise, weight, and rep tracking",
    },
    pro: {
      label: "Pro version",
      description: "Advanced charts, barbell mode, unlimited history",
    },
    comingSoon: "Video coming soon",
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
    proLabel: "PRO",
    plans: [
      {
        key: "monthly",
        name: "Monthly",
        price: "$4.99",
        period: "/mo",
        note: "7-day free trial",
        billing: "Billed monthly",
        highlight: false,
      },
      {
        key: "annual",
        name: "Annual",
        price: "$29.99",
        period: "/yr",
        note: "Save 50% vs monthly",
        billing: "Billed annually",
        highlight: true,
      },
      {
        key: "lifetime",
        name: "Lifetime",
        price: "$79.99",
        period: " one-time",
        note: "One payment, no subscription",
        billing: "Pay once",
        highlight: false,
      },
    ],
    mostPopular: "Most popular",
    cta: "Get started",
    legalNote:
      "Cancel anytime from your profile. Subscriptions renew automatically unless cancelled before the end of the current period.",
    loyalty: {
      title: "The longer you stay, the more you save",
      subtitle:
        "Every Pro renewal lowers the price of the next one — automatically, no action needed.",
      monthly: "Monthly: -$0.10 per renewal, up to -$1.00",
      annual: "Annual: -$1.00 per renewal, up to -$3.00",
    },
  },
  comparison: {
    badge: "PRO",
    title: "Take your training to the next level",
    columns: { free: "Free", pro: "Pro", lifetime: "Lifetime" },
    rows: [
      { label: "Workout and exercise tracking", free: true, pro: true, lifetime: true },
      { label: "CSV import", free: true, pro: true, lifetime: true },
      { label: "Rest timer", free: true, pro: true, lifetime: true },
      { label: "Per-exercise rest timer", free: false, pro: true, lifetime: true },
      { label: "History", free: "90 days", pro: true, lifetime: true },
      { label: "Calendar view", free: false, pro: true, lifetime: true },
      { label: "CSV export", free: false, pro: true, lifetime: true },
      { label: "Advanced charts (volume, 1RM, records)", free: false, pro: true, lifetime: true },
      { label: "Supersets", free: false, pro: true, lifetime: true },
      { label: "Automatic warmup sets", free: false, pro: true, lifetime: true },
      { label: "Barbell mode and plate calculator", free: false, pro: true, lifetime: true },
      { label: "Progress photos", free: false, pro: true, lifetime: true },
      { label: "Drag-and-drop reorder", free: false, pro: true, lifetime: true },
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
