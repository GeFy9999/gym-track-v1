"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/dictionaries";
import { analyticsAvailable, getConsent, onConsentChange, setConsent, track, trackPage } from "@/lib/analytics";

// Pages a visitor must be able to read before choosing.
const HIDDEN_ON = ["/privacy", "/terms", "/legal"];

type Props = { dict: Dictionary["consent"]; locale: Locale };

// Bottom banner, asked once per browser. "No" is exactly as easy as "Yes"
// (same size, same row) and nothing is sent before an answer, as required in
// France (CNIL) and Québec (Loi 25). The footer's "Statistics" link reopens it.
export default function ConsentBanner({ dict, locale }: Props) {
  const pathname = usePathname();
  // The server can't know the visitor's choice: render nothing there
  // ("unknown"), then the stored choice once in the browser.
  const consent = useSyncExternalStore(onConsentChange, getConsent, () => "unknown" as const);
  const pending = analyticsAvailable() && consent === null;

  useEffect(() => {
    trackPage(pathname);
  }, [pathname]);

  // The few clicks worth knowing about, without touching each server component.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.includes("play.google.com")) track("play_store_clicked");
      else if (href.includes("/register")) {
        track("signup_clicked", { plan: new URL(href, location.origin).searchParams.get("plan") });
      } else if (href.includes("/login")) track("login_clicked");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!pending || HIDDEN_ON.some((p) => pathname.endsWith(p))) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div
        role="dialog"
        aria-labelledby="consent-title"
        className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-[#faf6f1] shadow-2xl ring-1 ring-black/5"
      >
        <div className="px-5 pt-5 pb-4 sm:px-6" style={{ background: "#191714" }}>
          <h2 id="consent-title" className="text-xl font-black uppercase tracking-wide text-white">
            {dict.title}
          </h2>
        </div>
        <div className="px-5 pt-4 pb-5 sm:px-6">
          <p className="text-sm text-[#191714]/70">
            {dict.body}{" "}
            <Link href={`/${locale}/privacy`} className="underline">
              {dict.policy}
            </Link>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setConsent("denied")}
              className="flex-1 rounded-full bg-[#ece7dd] py-3 text-sm font-bold uppercase text-[#191714]"
            >
              {dict.decline}
            </button>
            <button
              type="button"
              onClick={() => setConsent("granted")}
              className="flex-1 rounded-full py-3 text-sm font-bold uppercase text-white"
              style={{ background: "#191714" }}
            >
              {dict.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Footer link that reopens the banner so the choice can be changed. */
export function ConsentSettingsLink({ label }: { label: string }) {
  if (!analyticsAvailable()) return null;
  return (
    <button
      type="button"
      onClick={() => setConsent(null)}
      className="hover:text-[#191714] transition-colors"
    >
      {label}
    </button>
  );
}
