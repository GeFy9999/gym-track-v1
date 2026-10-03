"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";

function ResetPasswordInner() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.resetPassword;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordRules = [
    { regex: /.{8,}/, label: t.rules.minLength },
    { regex: /[A-Z]/, label: t.rules.uppercase },
    { regex: /[a-z]/, label: t.rules.lowercase },
    { regex: /[0-9]/, label: t.rules.digit },
    { regex: /[^A-Za-z0-9]/, label: t.rules.special },
  ];

  const validate = () => {
    if (password.length < 8) return t.errors.minLength;
    if (!/[A-Z]/.test(password)) return t.errors.uppercase;
    if (!/[a-z]/.test(password)) return t.errors.lowercase;
    if (!/[0-9]/.test(password)) return t.errors.digit;
    if (!/[^A-Za-z0-9]/.test(password)) return t.errors.special;
    if (!confirm) return t.errors.confirmRequired;
    if (password !== confirm) return t.errors.mismatch;
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const error = validate();
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t.errors.generic);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6">
        <p className="text-red-500 mb-4">{t.invalidLink}</p>
        <Link href={`/${locale}/login`} className="text-[#c9552c] font-semibold text-sm">
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center pt-16 px-6">
        <div className="w-14 h-14 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
          <Lock size={24} className="text-[#3a9e6e]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.resetDone}</h1>
        <p className="text-sm text-gray-500 mb-8">{t.resetDoneDesc}</p>
        <Link
          href={`/${locale}/login`}
          className="bg-[#c9552c] text-white px-8 py-3 rounded-2xl font-semibold shadow-md"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-16 px-6">
      <div className="w-11 h-11 rounded-xl bg-[#c9552c]/10 flex items-center justify-center mb-3">
        <Lock size={20} className="text-[#c9552c]" />
      </div>

      <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">{t.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{t.subtitle}</p>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <label className="text-sm font-semibold text-gray-900 mb-1 block">{t.newPassword}</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#c9552c] rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-10 text-gray-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const passes = rule.regex.test(password);
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    <span className={passes ? "text-[#3a9e6e]" : "text-gray-400"}>
                      {passes ? "✓" : "✗"}
                    </span>
                    <span className={passes ? "text-[#3a9e6e]" : "text-gray-400"}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-gray-900 mb-1 block">{t.confirm}</label>
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#c9552c] rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-10 text-gray-400 transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {fieldError && <p className="text-red-500 text-xs mt-1">{fieldError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md mt-2"
        >
          {loading ? t.resetting : t.resetAction}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
