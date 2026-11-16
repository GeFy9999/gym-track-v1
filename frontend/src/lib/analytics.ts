import type { PostHog } from "posthog-js";
import { QUIZ_DONE_KEY } from "./onboardingQuiz";

// Anonymous product analytics (PostHog, EU servers), strictly opt-in: the
// SDK isn't even downloaded until the person says yes on the consent sheet
// or in Profile. No name, email or account id is ever sent — each device
// gets a random id, reset on logout.

const CONSENT_KEY = "analyticsConsent";
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com";

export type Consent = "granted" | "denied" | null;

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const listeners = new Set<(c: Consent) => void>();

export const analyticsAvailable = () => Boolean(POSTHOG_KEY);

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(consent: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Storage blocked: the choice still applies for this launch.
  }
  if (consent === "granted") {
    // The screen they said yes on was shown before consent: count it now.
    void load().then((ph) => {
      ph?.opt_in_capturing();
      trackScreen(location.pathname);
    });
  } else if (client) {
    client.opt_out_capturing();
    client.reset();
  }
  listeners.forEach((l) => l(consent));
}

export function onConsentChange(listener: (c: Consent) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called once at boot: loads PostHog only if the person already said yes. */
export function initAnalytics() {
  if (getConsent() === "granted") void load();
}

// Screen ids and tokens never leave the device: /session/3f2a… → /session/:id,
// and query strings (reset links carry a token) are dropped.
const ID_SEGMENT = /\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)(?=\/|$)/gi;
export const cleanPath = (path: string) => path.split(/[?#]/)[0].replace(ID_SEGMENT, "/:id");
const cleanUrl = (url: unknown) => {
  if (typeof url !== "string" || !url) return url;
  try {
    const u = new URL(url);
    return `${u.origin}${cleanPath(u.pathname)}`;
  } catch {
    return cleanPath(url);
  }
};

function load(): Promise<PostHog | null> {
  if (!POSTHOG_KEY) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: "localStorage",
        person_profiles: "identified_only", // we never identify: no person profiles
        autocapture: false,
        capture_pageview: false, // sent by trackScreen with a cleaned path
        capture_pageleave: false,
        // Off in code too, so turning them on in the PostHog dashboard
        // (remote config) can never widen what the consent text promises.
        disable_session_recording: true,
        disable_surveys: true,
        enable_heatmaps: false,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        capture_performance: false,
        capture_exceptions: false,
        before_send: (event) => {
          if (!event) return event;
          const p = event.properties;
          for (const k of ["$current_url", "$referrer", "$initial_referrer", "$initial_current_url"]) {
            if (k in p) p[k] = cleanUrl(p[k]);
          }
          if (typeof p.$pathname === "string") p.$pathname = cleanPath(p.$pathname);
          return event;
        },
      });
      client = posthog;
      return posthog;
    })
    .catch(() => {
      loading = null;
      return null;
    });
  return loading;
}

/** Records an event — a no-op unless the person opted in. */
export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
  if (getConsent() !== "granted") return;
  void load().then((ph) => ph?.capture(event, properties));
}

export function trackScreen(pathname: string) {
  if (getConsent() !== "granted") return;
  const path = cleanPath(pathname);
  void load().then((ph) => ph?.capture("$pageview", { $pathname: path, $current_url: `${location.origin}${path}` }));
}

/** On logout / account deletion: the next person on this phone gets a fresh anonymous id. */
export function resetAnalytics() {
  client?.reset();
}

/**
 * `localStorage.clear()` that keeps the analytics choice: it belongs to the
 * device, not the account, so signing out mustn't ask again.
 */
export function clearLocalStorageKeepingConsent() {
  const consent = getConsent();
  // Same for the first-launch questionnaire: answered once per device.
  const quizDone = localStorage.getItem(QUIZ_DONE_KEY);
  localStorage.clear();
  if (consent) localStorage.setItem(CONSENT_KEY, consent);
  if (quizDone) localStorage.setItem(QUIZ_DONE_KEY, quizDone);
}
