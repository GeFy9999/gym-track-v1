import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { API_URL } from "../lib/api";
import { consumePendingPlan } from "../utils/pendingPlan";
import {
  hasPendingCredentials,
  loginWithPendingSignup,
} from "../utils/pendingSignup";

export default function VerifyEmailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  // The verification token is single-use, so this effect must fire the
  // request exactly once — StrictMode's dev-only double-invoke would
  // otherwise send it twice, and the second call always fails with "link
  // expired" since the first one already consumed the token.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!token) {
      setStatus("error");
      setErrorMessage(t("verifyEmail.invalidLink"));
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || t("verifyEmail.errorGeneric"));

        // Confirming doesn't log in: the user heads back to the app (or
        // logs in here if this is where they want to use it).
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : t("verifyEmail.errorGeneric"));
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Opened inside the same app session that just signed up (e.g. the link
  // opened the app): the credentials are still in memory, sign in directly.
  const handleContinue = async () => {
    setContinuing(true);
    const result = await loginWithPendingSignup();
    setContinuing(false);
    if (result.status !== "ok") {
      navigate("/login");
      return;
    }
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    if (result.user.language) i18n.changeLanguage(result.user.language);
    const plan = consumePendingPlan();
    navigate(plan ? `/upgrade?plan=${plan}` : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-page-narrow text-center">
      <img
        src="/LogoGymsTrack5.webp"
        alt="GymsTrack"
        className="h-14 mx-auto mb-6"
      />

      {status === "verifying" && (
        <p className="text-sm text-gray-500">{t("verifyEmail.verifying")}</p>
      )}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={24} className="text-[#3a9e6e]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t("verifyEmail.success")}
          </h1>
          {hasPendingCredentials() ? (
            <button
              onClick={handleContinue}
              disabled={continuing}
              className="mt-4 w-full max-w-xs bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm"
            >
              {t("verifyEmail.continue")}
            </button>
          ) : (
            <>
              <p className="text-sm text-gray-500 max-w-xs">
                {t("verifyEmail.backToApp")}
              </p>
              <Link
                to="/login"
                className="mt-6 text-[#c9552c] font-semibold text-sm"
              >
                {t("verifyEmail.loginHere")}
              </Link>
            </>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle size={24} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{errorMessage}</p>
          <Link to="/login" className="text-[#c9552c] font-semibold text-sm">
            {t("verifyEmail.backToLogin")}
          </Link>
        </>
      )}
    </div>
  );
}
