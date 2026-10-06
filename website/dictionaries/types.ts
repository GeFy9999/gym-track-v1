export type Dictionary = {
  nav: {
    features: string;
    pricing: string;
    faq: string;
    login: string;
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
  about: {
    eyebrow: string;
    title: string;
    body: string;
    points: { title: string; description: string }[];
  };
  pricing: {
    proLabel: string;
    plans: {
      key: "monthly" | "annual" | "lifetime";
      name: string;
      price: string;
      period: string;
      note: string;
      billing: string;
      highlight: boolean;
    }[];
    mostPopular: string;
    cta: string;
    legalNote: string;
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
    columns: { free: string; pro: string };
    rows: { label: string; free: string | boolean; pro: boolean }[];
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
    contact: string;
    rights: string;
  };
  contact: {
    title: string;
    subtitle: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    topic: string;
    topics: {
      question: string;
      bug: string;
      billing: string;
      account: string;
      feedback: string;
      other: string;
    };
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    successTitle: string;
    successText: string;
    sendAnother: string;
    errors: {
      name: string;
      email: string;
      message: string;
      generic: string;
    };
    directTitle: string;
    directText: string;
    responseTime: string;
    helpTitle: string;
    faqLink: string;
    deleteAccountLink: string;
  };
  meta: {
    title: string;
    description: string;
  };
  auth: {
    continueWithGoogle: string;
    login: {
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      submit: string;
      submitting: string;
      forgotPassword: string;
      or: string;
      noAccount: string;
      createAccount: string;
      errors: {
        emailRequired: string;
        emailInvalid: string;
        passwordRequired: string;
        generic: string;
        unknown: string;
      };
    };
    register: {
      subtitle: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      confirmPassword: string;
      submit: string;
      submitting: string;
      or: string;
      haveAccount: string;
      signIn: string;
      legalPrefix: string;
      termsLink: string;
      legalAnd: string;
      privacyLink: string;
      strength: { weak: string; medium: string; good: string };
      rules: {
        minLength: string;
        uppercase: string;
        lowercase: string;
        digit: string;
        special: string;
      };
      errors: {
        nameMin: string;
        nameMax: string;
        emailRequired: string;
        emailInvalid: string;
        passwordMin: string;
        passwordUppercase: string;
        passwordLowercase: string;
        passwordDigit: string;
        passwordSpecial: string;
        confirmRequired: string;
        passwordMismatch: string;
        generic: string;
        unknown: string;
      };
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      email: string;
      emailPlaceholder: string;
      sendLink: string;
      emailSent: string;
      emailSentDesc: string;
      backToLogin: string;
      resendSuccess: string;
      noEmailReceived: string;
      retryIn: string;
      sending: string;
      retry: string;
      errors: { emailRequired: string; emailInvalid: string; generic: string };
    };
    resetPassword: {
      title: string;
      subtitle: string;
      newPassword: string;
      confirm: string;
      resetting: string;
      resetAction: string;
      invalidLink: string;
      backToLogin: string;
      resetDone: string;
      resetDoneDesc: string;
      signIn: string;
      rules: {
        minLength: string;
        uppercase: string;
        lowercase: string;
        digit: string;
        special: string;
      };
      errors: {
        minLength: string;
        uppercase: string;
        lowercase: string;
        digit: string;
        special: string;
        confirmRequired: string;
        mismatch: string;
        generic: string;
      };
    };
    verifyEmailPending: {
      title: string;
      subtitle: string;
      iVerified: string;
      checking: string;
      stillNotVerified: string;
      resendSuccess: string;
      noEmailReceived: string;
      retryIn: string;
      sending: string;
      retry: string;
      logout: string;
      errorGeneric: string;
    };
    verifyEmail: {
      verifying: string;
      success: string;
      redirecting: string;
      invalidLink: string;
      errorGeneric: string;
      backToLogin: string;
    };
  };
};

export type Locale = "fr" | "en";
export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";
