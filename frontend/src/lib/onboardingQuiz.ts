import { API_URL } from "./api";

// First-launch questionnaire, answered before signing in. Its answers wait
// in localStorage until the first sign-in on this device, then become the
// account's settings (applyPendingQuizAnswers).

export const REFERRAL_SOURCES = [
  "google_play",
  "tiktok",
  "youtube",
  "instagram",
  "google_search",
  "friend",
  "other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export type QuizAnswers = {
  usedOtherApp: boolean;
  weightUnit: "kg" | "lb";
  bodyWeight: number | null;
  restTimerEnabled: boolean;
  restTimerSeconds: number;
  referralSource: ReferralSource | null;
};

// Kept across sign-outs and session expiry (see
// clearLocalStorageKeepingConsent): the questionnaire is a once-per-device
// thing.
export const QUIZ_DONE_KEY = "onboardingQuizDone";
const ANSWERS_KEY = "onboardingQuizAnswers";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode…): the app still works, the
    // questionnaire just may show again next time.
  }
}

// Someone already used an account on this device before the questionnaire
// existed: signed in right now, or signed out but leaving the
// "onboardingDone_<userId>" mark that every sign-in sets and sign-out keeps.
// Their settings are already chosen, so the update mustn't ask them.
function hasUsedAppBefore(): boolean {
  try {
    if (localStorage.getItem("token")) return true;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith("onboardingDone_")) return true;
    }
  } catch {
    // Storage unavailable: treat as a first launch.
  }
  return false;
}

export function isQuizDone(): boolean {
  if (read(QUIZ_DONE_KEY)) return true;
  if (hasUsedAppBefore()) {
    write(QUIZ_DONE_KEY, "1");
    return true;
  }
  return false;
}

export function finishQuiz(answers: QuizAnswers) {
  write(ANSWERS_KEY, JSON.stringify(answers));
  write(QUIZ_DONE_KEY, "1");
}

function getPendingAnswers(): QuizAnswers | null {
  const raw = read(ANSWERS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizAnswers;
  } catch {
    write(ANSWERS_KEY, null);
    return null;
  }
}

/** Monday 00:00 of the week after `date`. */
function nextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weightPromptNotBeforeKey(userId: string) {
  return `weightPromptNotBefore_${userId}`;
}

function patchStoredUser(answers: QuizAnswers) {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    u.weightUnit = answers.weightUnit;
    u.restTimerEnabled = answers.restTimerEnabled;
    if (answers.restTimerEnabled) u.restTimerSeconds = answers.restTimerSeconds;
    localStorage.setItem("user", JSON.stringify(u));
  } catch {
    // Server values come back with the next /auth/me anyway.
  }
}

let applying = false;

/**
 * Turns the questionnaire's answers into the signed-in account's settings.
 * Returns whether the user asked to import their history (to send them to
 * the import screen), or null when there was nothing to apply.
 */
export function applyPendingQuizAnswers(): { goToImport: boolean } | null {
  const token = read("token");
  const answers = getPendingAnswers();
  if (!token || !answers || applying) return null;

  let userId = "";
  try {
    userId = JSON.parse(localStorage.getItem("user") ?? "null")?.id ?? "";
  } catch {
    // No stored user: settings still go to the server.
  }

  // Locally first, so the screen opened right after (import, dashboard)
  // already uses the chosen unit.
  patchStoredUser(answers);
  // Sent to the import screen once only, even if the requests below have to
  // be retried later.
  if (answers.usedOtherApp) {
    write(ANSWERS_KEY, JSON.stringify({ ...answers, usedOtherApp: false }));
  }
  // The weekly body weight reminder starts with the next week: this one's
  // was just answered (or skipped) in the questionnaire.
  if (userId) {
    write(weightPromptNotBeforeKey(userId), nextMonday(new Date()).toISOString());
  }

  const send = (path: string, method: string, body: unknown) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

  const requests: Promise<Response>[] = [
    send("/auth/weight-unit", "PATCH", { weightUnit: answers.weightUnit }),
    send("/auth/rest-timer-enabled", "PATCH", {
      restTimerEnabled: answers.restTimerEnabled,
    }),
  ];
  if (answers.restTimerEnabled) {
    requests.push(
      send("/auth/rest-timer", "PATCH", {
        restTimerSeconds: answers.restTimerSeconds,
      }),
    );
  }
  if (answers.referralSource) {
    requests.push(
      send("/auth/referral-source", "PATCH", {
        referralSource: answers.referralSource,
      }),
    );
  }

  applying = true;
  Promise.all(requests)
    // Body weight after the unit, since the server stores it in the
    // account's unit.
    .then(() =>
      answers.bodyWeight
        ? send("/body-weight", "POST", { value: answers.bodyWeight })
        : null,
    )
    .then(() => {
      write(ANSWERS_KEY, null);
      // /auth/me (fetched on launch) may have landed in between with the
      // old values.
      patchStoredUser(answers);
    })
    // Offline: kept, and retried on the next navigation.
    .catch(() => {})
    .finally(() => {
      applying = false;
    });

  return { goToImport: answers.usedOtherApp };
}
