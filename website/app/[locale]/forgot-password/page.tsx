"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";
import { interpolate } from "@/lib/interpolate";

const COOLDOWN_SECONDS = 300;

export default function ForgotPasswordPage() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.forgotPassword;

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

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

  const sendEmail = useCallback(async (value: string) => {
    setServerError(null);
    setLoading(true);
    setResendSuccess(false);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t.errors.generic);

      setSentEmail(value);
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFieldError(t.errors.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(t.errors.emailInvalid);
      return;
    }
    setFieldError(null);
    await sendEmail(email);
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading || !sentEmail) return;
    await sendEmail(sentEmail);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
        <Link href={`/${locale}/login`} className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <ArrowLeft size={16} className="text-gray-700" />
        </Link>

        <div className="text-center mt-8">
          <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-[#c9552c]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.emailSent}</h1>
          <p className="text-sm text-gray-500 mb-8">
            {interpolate(t.emailSentDesc, { email: sentEmail })}
          </p>
          <Link href={`/${locale}/login`} className="text-[#c9552c] font-semibold text-sm">
            {t.backToLogin}
          </Link>
        </div>

        {resendSuccess && (
          <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mt-6 text-center">
            {t.resendSuccess}
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <Mail size={48} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 text-center">{t.noEmailReceived}</p>
          <button onClick={handleResend} disabled={cooldown > 0 || loading} className="mt-1">
            {cooldown > 0 ? (
              <span className="text-sm text-gray-400">
                {interpolate(t.retryIn, { time: formatCooldown(cooldown) })}
              </span>
            ) : (
              <span className="text-sm text-[#c9552c] font-semibold">
                {loading ? t.sending : t.retry}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
      <Link href={`/${locale}/login`} className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mb-4">
        <ArrowLeft size={16} className="text-gray-700" />
      </Link>

      <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1 mt-4">
        {t.title}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{t.subtitle}</p>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-1 block">{t.email}</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              fieldError ? "border-red-500" : "border-gray-200 focus:border-[#c9552c]"
            }`}
            placeholder={t.emailPlaceholder}
          />
          {fieldError && <p className="text-red-500 text-xs mt-1">{fieldError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md"
        >
          {loading ? t.sending : t.sendLink}
        </button>
      </form>
    </div>
  );
}
