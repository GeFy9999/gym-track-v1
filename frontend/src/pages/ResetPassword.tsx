import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { API_URL } from "../lib/api";

type ResetForm = {
  password: string;
  confirm: string;
};

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordRules = [
    { regex: /.{8,}/, label: t("resetPassword.rules.minLength") },
    { regex: /[A-Z]/, label: t("resetPassword.rules.uppercase") },
    { regex: /[a-z]/, label: t("resetPassword.rules.lowercase") },
    { regex: /[0-9]/, label: t("resetPassword.rules.digit") },
    { regex: /[^A-Za-z0-9]/, label: t("resetPassword.rules.special") },
  ];

  const resetSchema = z
    .object({
      password: z
        .string()
        .min(8, t("resetPassword.errors.minLength"))
        .regex(/[A-Z]/, t("resetPassword.errors.uppercase"))
        .regex(/[a-z]/, t("resetPassword.errors.lowercase"))
        .regex(/[0-9]/, t("resetPassword.errors.digit"))
        .regex(/[^A-Za-z0-9]/, t("resetPassword.errors.special")),
      confirm: z.string().min(1, t("resetPassword.errors.confirmRequired")),
    })
    .refine((data) => data.password === data.confirm, {
      message: t("resetPassword.errors.mismatch"),
      path: ["confirm"],
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: "onChange",
  });

  const watchPassword = watch("password", "");

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: data.password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t("resetPassword.errors.generic"));

      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t("resetPassword.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6">
        <p className="text-red-500 mb-4">{t("resetPassword.invalidLink")}</p>
        <Link to="/login" className="text-[#c9552c] font-semibold text-sm">
          {t("resetPassword.backToLogin")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center pt-16 px-6">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-14 mx-auto mb-6"
        />
        <div className="w-14 h-14 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
          <Lock size={24} className="text-[#3a9e6e]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {t("resetPassword.resetDone")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {t("resetPassword.resetDoneDesc")}
        </p>
        <Link
          to="/login"
          className="bg-[#c9552c] text-white px-8 py-3 rounded-2xl font-semibold shadow-md"
        >
          {t("resetPassword.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-16 px-6">
      <div className="text-center mb-8">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-14 mx-auto mb-6"
        />
      </div>

      <div className="w-11 h-11 rounded-xl bg-[#c9552c]/10 flex items-center justify-center mb-3">
        <Lock size={20} className="text-[#c9552c]" />
      </div>

      <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
        {t("resetPassword.title")}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {t("resetPassword.subtitle")}
      </p>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <label className="text-sm font-semibold text-gray-900 mb-1 block">
            {t("resetPassword.newPassword")}
          </label>
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.password
                ? "border-red-500"
                : "border-gray-200 focus:border-[#c9552c]"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-10 text-gray-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          {watchPassword.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const passes = rule.regex.test(watchPassword);
                return (
                  <div
                    key={rule.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className={passes ? "text-[#3a9e6e]" : "text-gray-400"}
                    >
                      {passes ? "✓" : "✗"}
                    </span>
                    <span
                      className={passes ? "text-[#3a9e6e]" : "text-gray-400"}
                    >
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-sm font-semibold text-gray-900 mb-1 block">
            {t("resetPassword.confirm")}
          </label>
          <input
            type={showConfirm ? "text" : "password"}
            {...register("confirm")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.confirm
                ? "border-red-500"
                : "border-gray-200 focus:border-[#c9552c]"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-10 text-gray-400 transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errors.confirm && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md mt-2"
        >
          {loading ? t("resetPassword.resetting") : t("resetPassword.resetAction")}
        </button>
      </form>
    </div>
  );
}
