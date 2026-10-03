import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, LogOut } from "lucide-react";
import { API_URL } from "../lib/api";
import { consumePendingPlan } from "../utils/pendingPlan";
import { useRestTimerContext } from "../contexts/RestTimerContext";

const COOLDOWN_SECONDS = 300;

export default function VerifyEmailPendingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { skip: stopRestTimer } = useRestTimerContext();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setEmail(JSON.parse(stored).email ?? "");
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleResend = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || cooldown > 0 || sending) return;

    setServerError(null);
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t("verifyEmailPending.errorGeneric"));

      setCooldown(COOLDOWN_SECONDS);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("verifyEmailPending.errorGeneric"));
    } finally {
      setSending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldown, sending]);

  const handleCheckVerified = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setServerError(null);
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t("verifyEmailPending.errorGeneric"));
      const { user } = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      if (user.emailVerified) {
        const plan = consumePendingPlan();
        navigate(plan ? `/upgrade?plan=${plan}` : "/dashboard");
      } else {
        setServerError(t("verifyEmailPending.stillNotVerified"));
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("verifyEmailPending.errorGeneric"));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    stopRestTimer();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
      <div className="text-center mt-8">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-14 mx-auto mb-6"
        />
        <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-[#c9552c]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {t("verifyEmailPending.title")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {t("verifyEmailPending.subtitle", { email })}
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-4 text-center">
          {serverError}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mb-4 text-center">
          {t("verifyEmailPending.resendSuccess")}
        </div>
      )}

      <button
        onClick={handleCheckVerified}
        disabled={checking}
        className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold shadow-md"
      >
        {checking ? t("verifyEmailPending.checking") : t("verifyEmailPending.iVerified")}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Mail size={48} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 text-center">
          {t("verifyEmailPending.noEmailReceived")}
        </p>
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || sending}
          className="mt-1"
        >
          {cooldown > 0 ? (
            <span className="text-sm text-gray-400">
              {t("verifyEmailPending.retryIn", { time: formatCooldown(cooldown) })}
            </span>
          ) : (
            <span className="text-sm text-[#c9552c] font-semibold">
              {sending ? t("verifyEmailPending.sending") : t("verifyEmailPending.retry")}
            </span>
          )}
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 text-sm text-gray-400 py-6"
      >
        <LogOut size={14} />
        {t("verifyEmailPending.logout")}
      </button>
    </div>
  );
}
