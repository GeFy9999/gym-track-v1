import type { Dictionary } from "./types";

const en: Dictionary = {
  nav: {
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log in",
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
  about: {
    eyebrow: "How we work",
    title: "Workouts, not rigid routines",
    body: "Most apps like Strong or Hevy ask you to build a routine ahead of time, exercise by exercise, before you even start training. GymsTrack works differently: pick a muscle group, start your workout, and add exercises as you go — exactly how you actually train.",
    points: [
      {
        title: "By workout, not by exercise",
        description:
          "Organize around your training days (Back, Legs, Push...) instead of rigid routines prepared in advance.",
      },
      {
        title: "Flexible from the start",
        description:
          "Improvise your workout in real time — add, remove, or reorder exercises without ever being locked into a fixed plan.",
      },
      {
        title: "Tracking that keeps up",
        description:
          "Weight, reps, and progress are logged automatically, no matter how your workout evolves.",
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
    columns: { free: "Free", pro: "Pro" },
    rows: [
      { label: "Workout and exercise tracking", free: true, pro: true },
      { label: "CSV import", free: true, pro: true },
      { label: "Rest timer", free: true, pro: true },
      { label: "Per-exercise rest timer", free: false, pro: true },
      { label: "History", free: "90 days", pro: true },
      { label: "Calendar view", free: false, pro: true },
      { label: "CSV export", free: false, pro: true },
      { label: "Advanced charts (volume, 1RM, records)", free: false, pro: true },
      { label: "Supersets", free: false, pro: true },
      { label: "Automatic warmup sets", free: false, pro: true },
      { label: "Barbell mode and plate calculator", free: false, pro: true },
      { label: "Progress photos", free: false, pro: true },
      { label: "Drag-and-drop reorder", free: false, pro: true },
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
    contact: "Contact",
    rights: "All rights reserved.",
  },
  contact: {
    title: "Contact support",
    subtitle:
      "A question, a problem with the app or your subscription? Write to us and we'll reply by email.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@email.com",
    topic: "Topic",
    topics: {
      question: "Question",
      bug: "Problem / bug",
      billing: "Subscription / payment",
      account: "Account / deletion",
      feedback: "Suggestion",
      other: "Other",
    },
    message: "Message",
    messagePlaceholder: "Describe your question or problem as precisely as you can.",
    submit: "Send message",
    sending: "Sending…",
    successTitle: "Message sent!",
    successText: "Thanks, we got your message. We'll reply to {email} as soon as possible.",
    sendAnother: "Send another message",
    errors: {
      name: "Enter your name.",
      email: "Enter a valid email address.",
      message: "Your message needs at least 10 characters.",
      generic: "Sending failed. Try again, or email us directly.",
    },
    directTitle: "By email",
    directText: "You can also write to us directly:",
    responseTime: "We usually reply within 48 hours.",
    helpTitle: "Maybe already answered",
    faqLink: "Frequently asked questions",
    deleteAccountLink: "Delete my account",
  },
  meta: {
    title: "GymsTrack — Track your workouts, progress every week",
    description:
      "The simple, powerful strength-training app: guided workouts, progress charts, personal records, and progress photos. Available on iOS and Android.",
  },
  auth: {
    continueWithGoogle: "Continue with Google",
    login: {
      subtitle: "Log in to your account",
      email: "Email",
      emailPlaceholder: "your@email.com",
      password: "Password",
      submit: "Log in",
      submitting: "Logging in...",
      forgotPassword: "Forgot password?",
      or: "or",
      noAccount: "Don't have an account?",
      createAccount: "Create an account",
      errors: {
        emailRequired: "Email is required",
        emailInvalid: "Invalid email",
        passwordRequired: "Password is required",
        generic: "Login error",
        unknown: "Unknown error",
      },
    },
    register: {
      subtitle: "Create your account",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      password: "Password",
      confirmPassword: "Confirm password",
      submit: "Create my account",
      submitting: "Creating...",
      or: "or",
      haveAccount: "Already have an account?",
      signIn: "Log in",
      legalPrefix: "By creating an account, you agree to our",
      termsLink: "terms of service",
      legalAnd: "and our",
      privacyLink: "privacy policy",
      strength: { weak: "Weak", medium: "Medium", good: "Good" },
      rules: {
        minLength: "At least 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        digit: "One digit",
        special: "One special character (!@#$...)",
      },
      errors: {
        nameMin: "Name must be at least 2 characters",
        nameMax: "Name can't exceed 50 characters",
        emailRequired: "Email is required",
        emailInvalid: "Invalid email",
        passwordMin: "At least 8 characters",
        passwordUppercase: "Must contain an uppercase letter",
        passwordLowercase: "Must contain a lowercase letter",
        passwordDigit: "Must contain a digit",
        passwordSpecial: "Must contain a special character",
        confirmRequired: "Confirm your password",
        passwordMismatch: "Passwords don't match",
        generic: "Registration error",
        unknown: "Unknown error",
      },
    },
    forgotPassword: {
      title: "Forgot password",
      subtitle: "Enter your email and we'll send you a link to reset your password.",
      email: "Email",
      emailPlaceholder: "you@email.com",
      sendLink: "Send link",
      emailSent: "Email sent",
      emailSentDesc: "A reset link has been sent to {email}. Check your inbox.",
      backToLogin: "Back to login",
      resendSuccess: "Email resent successfully",
      noEmailReceived: "Didn't get anything? Check your spam or",
      retryIn: "Retry in {time}",
      sending: "Sending...",
      retry: "retry",
      errors: {
        emailRequired: "Email is required",
        emailInvalid: "Invalid email",
        generic: "Error",
      },
    },
    resetPassword: {
      title: "New password",
      subtitle: "Choose a new password for your account.",
      newPassword: "New password",
      confirm: "Confirm",
      resetting: "Resetting...",
      resetAction: "Reset",
      invalidLink: "Invalid link",
      backToLogin: "Back to login",
      resetDone: "Password reset",
      resetDoneDesc: "You can now sign in with your new password.",
      signIn: "Sign in",
      rules: {
        minLength: "Minimum 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        digit: "One digit",
        special: "One special character (!@#$...)",
      },
      errors: {
        minLength: "Minimum 8 characters",
        uppercase: "Must contain an uppercase letter",
        lowercase: "Must contain a lowercase letter",
        digit: "Must contain a digit",
        special: "Must contain a special character",
        confirmRequired: "Confirm your password",
        mismatch: "Passwords don't match",
        generic: "Error",
      },
    },
    verifyEmailPending: {
      title: "Confirm your email",
      subtitle: "We sent a confirmation link to {email}. Click the link to activate your account.",
      iVerified: "I confirmed, continue",
      checking: "Checking...",
      stillNotVerified: "Your email isn't confirmed yet.",
      resendSuccess: "Email resent successfully",
      noEmailReceived: "Didn't get anything? Check your spam or",
      retryIn: "Retry in {time}",
      sending: "Sending...",
      retry: "retry",
      logout: "Log out",
      errorGeneric: "Error",
    },
    verifyEmail: {
      verifying: "Confirming your email...",
      success: "Email confirmed!",
      redirecting: "Redirecting...",
      invalidLink: "Invalid link",
      errorGeneric: "Error",
      backToLogin: "Back to login",
    },
  },
};

export default en;
