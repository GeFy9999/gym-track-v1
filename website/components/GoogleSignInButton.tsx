"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { startCheckoutForPendingPlan } from "@/lib/checkout";
import type { Locale } from "@/dictionaries";

// Same OAuth client as the mobile/web app (client IDs are public) — just
// needs gymstrack.app added as an authorized JavaScript origin in that
// Google Cloud project for the button below to actually work here.
const GOOGLE_CLIENT_ID = "535959553524-5nicf9d43pi0ssp9da782qb38em3anhn.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

type Props = {
  locale: Locale;
};

export default function GoogleSignInButton({ locale }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const completeGoogleLogin = async (idToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: idToken, language: locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google auth error");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const checkout = await startCheckoutForPendingPlan(data.token);
      if (checkout && "url" in checkout) {
        window.location.href = checkout.url;
        return;
      }
      router.push(`/${locale}#tarifs`);
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initGoogle = () => {
      if (cancelled || !window.google || !buttonRef.current) return;
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => completeGoogleLogin(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        locale,
        width: containerRef.current?.offsetWidth || 320,
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div ref={containerRef} className="w-full flex justify-center">
        <div ref={buttonRef} className="w-full origin-center" />
      </div>
    </>
  );
}
