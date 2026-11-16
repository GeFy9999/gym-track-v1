import type { PostHog } from "posthog-js";

// Anonymous visit statistics for the marketing site (PostHog EU, same project
// as the app), strictly opt-in: the SDK isn't downloaded until the visitor
// says yes on the banner. No name or email is ever sent; ids and query
// strings are stripped from URLs. Mirrors frontend/src/lib/analytics.ts.

const CONSENT_KEY = "analyticsConsent";
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

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

export function setConsent(consent: "granted" | "denied" | null) {
  try {
    if (consent) localStorage.setItem(CONSENT_KEY, consent);
    else localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  if (consent === "granted") {
    // The page they said yes on was shown before consent: count it now.
    void load().then((ph) => {
      ph?.opt_in_capturing();
      trackPage(location.pathname);
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

const ID_SEGMENT = /\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)(?=\/|$)/gi;
const cleanPath = (path: string) => path.split(/[?#]/)[0].replace(ID_SEGMENT, "/:id");
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
        person_profiles: "identified_only",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        // Off in code too, so the PostHog dashboard can never widen what the
        // banner promises.
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

export function track(event: string, properties?: Record<string, string | number | boolean | null>) {
  if (getConsent() !== "granted") return;
  void load().then((ph) => ph?.capture(event, properties));
}

export function trackPage(pathname: string) {
  if (getConsent() !== "granted") return;
  const path = cleanPath(pathname);
  void load().then((ph) => ph?.capture("$pageview", { $pathname: path, $current_url: `${location.origin}${path}` }));
}
