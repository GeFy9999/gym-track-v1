import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { API_URL } from "../lib/api";
import { consumePendingPlan } from "../utils/pendingPlan";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setStatus("success");
        const plan = consumePendingPlan();
        setTimeout(() => navigate(plan ? `/upgrade?plan=${plan}` : "/dashboard"), 1500);
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : t("verifyEmail.errorGeneric"));
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6 text-center">
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
          <p className="text-sm text-gray-500">{t("verifyEmail.redirecting")}</p>
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
