"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";
import { capturePendingPlan } from "@/lib/pendingPlan";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const PASSWORD_RULES = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
function getPasswordStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 2) return 1;
  if (passed <= 4) return 2;
  return 3;
}

function RegisterInner() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.register;
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    capturePendingPlan(searchParams.get("plan"));
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const strengthLevels = [
    { label: t.strength.weak, color: "#c9552c" },
    { label: t.strength.medium, color: "#e2703a" },
    { label: t.strength.good, color: "#3a9e6e" },
  ];
  const strengthInfo = strengthLevels[Math.max(strength - 1, 0)];

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t.errors.nameMin;
    else if (name.length > 50) next.name = t.errors.nameMax;

    if (!email) next.email = t.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.errors.emailInvalid;

    if (password.length < 8) next.password = t.errors.passwordMin;
    else if (!/[A-Z]/.test(password)) next.password = t.errors.passwordUppercase;
    else if (!/[a-z]/.test(password)) next.password = t.errors.passwordLowercase;
    else if (!/[0-9]/.test(password)) next.password = t.errors.passwordDigit;
    else if (!/[^A-Za-z0-9]/.test(password)) next.password = t.errors.passwordSpecial;

    if (!confirmPassword) next.confirmPassword = t.errors.confirmRequired;
    else if (password !== confirmPassword) next.confirmPassword = t.errors.passwordMismatch;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, language: locale }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t.errors.generic);

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      router.push(`/${locale}/verify-email-pending`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-10">
      <div className="px-6 pt-12 pb-8 text-center bg-[#191714]">
        <Link href={`/${locale}`}>
          <Image
            src="/logo.webp"
            alt="GymsTrack"
            width={169}
            height={64}
            className="mx-auto mb-3"
          />
        </Link>
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
          {t.subtitle}
        </p>
      </div>

      <div className="px-6 pt-6 max-w-sm mx-auto">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-6">
            {serverError}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
              {t.name}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.name ? "ring-2 ring-red-500" : ""
                }`}
                placeholder={t.namePlaceholder}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
              {t.email}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.email ? "ring-2 ring-red-500" : ""
                }`}
                placeholder={t.emailPlaceholder}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
              {t.password}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-12 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.password ? "ring-2 ring-red-500" : ""
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div key={level} className="flex-1 h-1.5 rounded-full bg-gray-300 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: level <= strength ? "100%" : "0%",
                          background: strengthInfo.color,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                  style={{ color: strengthInfo.color }}
                >
                  {strengthInfo.label}
                </span>
              </div>
            )}
            {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
              {t.confirmPassword}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-12 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.confirmPassword ? "ring-2 ring-red-500" : ""
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-all shadow-sm mt-2 active:scale-[0.98]"
          >
            {loading ? t.submitting : t.submit}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            {t.legalPrefix}{" "}
            <a href="https://gymstrack.com/terms" className="text-[#c9552c] underline">
              {t.termsLink}
            </a>{" "}
            {t.legalAnd}{" "}
            <a href="https://gymstrack.com/privacy" className="text-[#c9552c] underline">
              {t.privacyLink}
            </a>
          </p>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.or}</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleSignInButton locale={locale} />

        <p className="text-center text-sm text-gray-500 mt-8 pb-8">
          {t.haveAccount}{" "}
          <Link href={`/${locale}/login`} className="text-[#c9552c] font-bold">
            {t.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
