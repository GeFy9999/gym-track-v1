"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, LogOut } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";
import { interpolate } from "@/lib/interpolate";
import { consumePendingPlan } from "@/lib/pendingPlan";
import { startCheckoutForPendingPlan } from "@/lib/checkout";

const COOLDOWN_SECONDS = 300;

export default function VerifyEmailPendingPage() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.verifyEmailPending;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists client-side, so this can't be a lazy useState
    // initializer (that would also run during this client component's
    // server-side render pass) — it has to be read here instead.
    const stored = localStorage.getItem("user");
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      if (!res.ok) throw new Error(result.error || t.errorGeneric);

      setCooldown(COOLDOWN_SECONDS);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.errorGeneric);
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
      if (!res.ok) throw new Error(t.errorGeneric);
      const { user } = await res.json();
      localStorage.setItem("user", JSON.stringify(user));

      if (user.emailVerified) {
        const checkout = await startCheckoutForPendingPlan(token);
        if (checkout && "url" in checkout) {
          window.location.href = checkout.url;
          return;
        }
        router.push(`/${locale}#tarifs`);
      } else {
        setServerError(t.stillNotVerified);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.errorGeneric);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    consumePendingPlan();
    localStorage.clear();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
      <div className="text-center mt-8">
        <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-[#c9552c]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-sm text-gray-500 mb-8">{interpolate(t.subtitle, { email })}</p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-4 text-center">
          {serverError}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mb-4 text-center">
          {t.resendSuccess}
        </div>
      )}

      <button
        onClick={handleCheckVerified}
        disabled={checking}
        className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold shadow-md"
      >
        {checking ? t.checking : t.iVerified}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Mail size={48} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 text-center">{t.noEmailReceived}</p>
        <button onClick={handleResend} disabled={cooldown > 0 || sending} className="mt-1">
          {cooldown > 0 ? (
            <span className="text-sm text-gray-400">
              {interpolate(t.retryIn, { time: formatCooldown(cooldown) })}
            </span>
          ) : (
            <span className="text-sm text-[#c9552c] font-semibold">
              {sending ? t.sending : t.retry}
            </span>
          )}
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 text-sm text-gray-400 py-6"
      >
        <LogOut size={14} />
        {t.logout}
      </button>
    </div>
  );
}
