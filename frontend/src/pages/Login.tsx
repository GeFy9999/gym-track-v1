import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Mail } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { isQuizDone } from "../lib/onboardingQuiz";

// Sign-in choice: Google, or email (the form lives on /login/email).
export default function LoginPage() {
  const { t } = useTranslation();

  // First launch on this device: the questionnaire comes first.
  if (!isQuizDone()) return <Navigate to="/onboarding" replace />;

  // Same height as the Google button above it: Google's own 40px button on
  // the web, the app's taller one on Android.
  const emailButtonSize = Capacitor.isNativePlatform() ? "py-3.5" : "h-10";

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col">
      {/* Same dark header as the email form (/login/email). */}
      <div
        className="px-page-narrow pt-12 pb-8 text-center"
        style={{ background: "#191714" }}
      >
        <img
          src="/LogoGymsTrack5.webp"
          width={506}
          height={192}
          alt="GymsTrack"
          className="h-16 w-auto mx-auto mb-3"
        />
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
          {t("login.subtitle")}
        </p>
      </div>

      <div className="flex-1 flex flex-col px-page-narrow pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* The two buttons sit in the middle of the space under the header. */}
        <div className="flex-1 flex flex-col justify-center-safe py-10">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl font-black text-gray-900 text-center leading-tight">
              {t("loginChoice.title")}
            </h1>
            <p className="text-sm text-gray-500 text-center mt-3 px-2 leading-relaxed">
              {t("loginChoice.subtitle")}
            </p>

            <div className="mt-8 flex flex-col">
              <GoogleLoginButton enlarged={false} />

              <div className="flex items-center gap-4 my-5 px-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {t("login.or")}
                </span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <div className="px-4">
                <Link
                  to="/login/email"
                  className={`w-full flex items-center justify-center gap-3 bg-[#c9552c] text-white rounded-full font-bold text-sm active:scale-[0.98] transition-transform ${emailButtonSize}`}
                >
                  <Mail size={18} />
                  {t("loginChoice.email")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Google sign-in can create an account from here, so the terms are
            shown here too, not only on the register page. */}
        <p className="text-xs text-gray-400 text-center leading-relaxed px-4 max-w-sm mx-auto">
          {t("common.googleLegalPrefix")}{" "}
          <Link to="/terms" className="text-[#c9552c] underline">
            {t("register.termsLink")}
          </Link>{" "}
          {t("register.legalAnd")}{" "}
          <Link to="/privacy" className="text-[#c9552c] underline">
            {t("register.privacyLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
