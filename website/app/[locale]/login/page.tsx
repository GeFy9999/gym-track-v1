"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";
import { startCheckoutForPendingPlan } from "@/lib/checkout";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.login;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email) next.email = t.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.errors.emailInvalid;
    if (!password) next.password = t.errors.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t.errors.generic);

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      const checkout = await startCheckoutForPendingPlan(result.token);
      if (checkout && "url" in checkout) {
        window.location.href = checkout.url;
        return;
      }
      router.push(`/${locale}#tarifs`);
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
            {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-all shadow-sm mt-2 active:scale-[0.98]"
          >
            {loading ? t.submitting : t.submit}
          </button>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-xs font-bold text-[#c9552c] uppercase tracking-wide text-center mt-1"
          >
            {t.forgotPassword}
          </Link>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t.or}</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleSignInButton locale={locale} />

        <p className="text-center text-sm text-gray-500 mt-8">
          {t.noAccount}{" "}
          <Link href={`/${locale}/register`} className="text-[#c9552c] font-bold">
            {t.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
