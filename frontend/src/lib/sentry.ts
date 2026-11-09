import * as Sentry from "@sentry/react";
import { cleanPath } from "./analytics";

// Error reporting without personal data: no user, no request headers (the
// Authorization token!), no query strings (reset/verify links carry tokens),
// no console logs. Off entirely when no DSN is configured.
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

const scrubUrl = (url: unknown) => {
  if (typeof url !== "string") return url;
  try {
    const u = new URL(url, location.origin);
    return `${u.origin}${cleanPath(u.pathname)}`;
  } catch {
    return cleanPath(url);
  }
};

export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Belt and braces on top of dataCollection.
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
        delete event.request.query_string;
        event.request.url = scrubUrl(event.request.url) as string | undefined;
      }
      return event;
    },
    beforeBreadcrumb(crumb) {
      if (crumb.category === "console" || crumb.category?.startsWith("ui.")) return null;
      if (crumb.data) {
        for (const k of ["url", "from", "to"]) {
          if (k in crumb.data) crumb.data[k] = scrubUrl(crumb.data[k]);
        }
      }
      return crumb;
    },
  });
}
