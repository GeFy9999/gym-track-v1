import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { API_URL } from "../lib/api";

const GOOGLE_CLIENT_ID =
  "535959553524-5nicf9d43pi0ssp9da782qb38em3anhn.apps.googleusercontent.com";

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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C40.4 36 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const completeGoogleLogin = async (idToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: idToken,
          // Only used the first time, when this Google sign-in creates a
          // brand-new account — an existing account keeps its own saved
          // language preference instead.
          language: i18n.language?.startsWith("en") ? "en" : "fr",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur Google Auth");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (!data.isNewUser) {
        localStorage.setItem(`onboardingDone_${data.user.id}`, "true");
      }
      if (data.user.language) {
        i18n.changeLanguage(data.user.language);
      }
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  // Native (Capacitor): Google's web-based Identity Services script doesn't
  // work embedded in a WebView (Google blocks it), so we use the platform's
  // native sign-in flow instead — same backend endpoint, same server-side
  // token verification either way.
  useEffect(() => {
    if (!isNative) return;
    GoogleSignIn.initialize({ clientId: GOOGLE_CLIENT_ID });
  }, [isNative]);

  const handleNativeSignIn = async () => {
    try {
      const result = await GoogleSignIn.signIn();
      if (result.idToken) await completeGoogleLogin(result.idToken);
    } catch (err) {
      console.error("Google native sign-in error:", err);
    }
  };

  // Web: render Google's own Identity Services button once its script has
  // loaded (it's injected via a <script> tag in index.html).
  useEffect(() => {
    if (isNative) return;

    let cancelled = false;

    const initGoogle = () => {
      if (cancelled || !window.google || !buttonRef.current) return;

      // Avoid duplicate init/render (e.g. React StrictMode double-invoking effects in dev)
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
        locale: "fr",
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
  }, [isNative, navigate]);

  if (isNative) {
    return (
      <div className="w-full px-4">
        <button
          onClick={handleNativeSignIn}
          className="w-full flex items-center justify-center gap-3 bg-black text-white py-3.5 rounded-full font-medium"
        >
          <GoogleGlyph />
          {t("common.continueWithGoogle")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div ref={containerRef} className="w-full flex justify-center py-1">
        <div ref={buttonRef} className="w-full origin-center scale-110" />
      </div>
    </div>
  );
}
