import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGoogle = async (response: { credential: string }) => {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: response.credential,
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

    let cancelled = false;

    const initGoogle = () => {
      if (cancelled || !window.google || !buttonRef.current) return;

      // Avoid duplicate init/render (e.g. React StrictMode double-invoking effects in dev)
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogle,
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

    // Google script might not be loaded yet
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
  }, [navigate]);

  return (
    <div className="w-full px-4">
      <div ref={containerRef} className="w-full flex justify-center py-1">
        <div ref={buttonRef} className="w-full origin-center scale-110" />
      </div>
    </div>
  );
}
