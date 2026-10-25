import { API_URL } from "./api";

// Counts the API requests currently in flight, app-wide, so a small
// spinner can show up whenever one takes a while (bad gym signal, slow
// server) without every screen having to wire its own loading state.
type Listener = (inFlight: number) => void;

let inFlight = 0;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((fn) => fn(inFlight));

export function onNetworkActivity(fn: Listener) {
  listeners.add(fn);
  fn(inFlight);
  return () => {
    listeners.delete(fn);
  };
}

let installed = false;

export function trackApiRequests() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!url.startsWith(API_URL)) return originalFetch(input, init);

    inFlight++;
    notify();
    try {
      return await originalFetch(input, init);
    } finally {
      inFlight--;
      notify();
    }
  };
}
