import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_URL } from "../lib/api";

const PASSWORD_RULES = [
  /.{8,}/,
  /[A-Z]/,
  /[a-z]/,
  /[0-9]/,
  /[^A-Za-z0-9]/,
];

function getPasswordStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 2) return 1;
  if (passed <= 4) return 2;
  return 3;
}

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const STRENGTH_LEVELS = [
    { label: t("register.strength.weak"), color: "#c9552c" },
    { label: t("register.strength.medium"), color: "#e2703a" },
    { label: t("register.strength.good"), color: "#3a9e6e" },
  ];

  const registerSchema = z
    .object({
      name: z
        .string()
        .min(2, t("register.errors.nameMin"))
        .max(50, t("register.errors.nameMax")),
      email: z
        .string()
        .min(1, t("register.errors.emailRequired"))
        .email(t("register.errors.emailInvalid")),
      password: z
        .string()
        .min(8, t("register.errors.passwordMin"))
        .regex(/[A-Z]/, t("register.errors.passwordUppercase"))
        .regex(/[a-z]/, t("register.errors.passwordLowercase"))
        .regex(/[0-9]/, t("register.errors.passwordDigit"))
        .regex(/[^A-Za-z0-9]/, t("register.errors.passwordSpecial")),
      confirmPassword: z.string().min(1, t("register.errors.confirmRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("register.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const watchPassword = watch("password", "");
  const strength = getPasswordStrength(watchPassword);
  const strengthInfo = STRENGTH_LEVELS[strength - 1];

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          // Detected from the browser locale by i18next-browser-languagedetector
          // so a new account starts in the visitor's own language.
          language: i18n.language?.startsWith("en") ? "en" : "fr",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || t("register.errors.generic"));
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t("register.errors.unknown"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-10">
      <div
        className="px-6 pt-12 pb-8 text-center"
        style={{ background: "#191714" }}
      >
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-16 mx-auto mb-3"
        />
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
          {t("register.subtitle")}
        </p>
      </div>

      <div className="px-6 pt-6">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-6">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block"
            >
              {t("register.name")}
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="name"
                type="text"
                {...register("name")}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.name ? "ring-2 ring-red-500" : ""
                }`}
                placeholder={t("register.namePlaceholder")}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block"
            >
              {t("register.email")}
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="email"
                type="text"
                {...register("email")}
                className={`w-full bg-[#ece7dd] rounded-full pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
                  errors.email ? "ring-2 ring-red-500" : ""
                }`}
                placeholder={t("register.emailPlaceholder")}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block"
            >
              {t("register.password")}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
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

            {watchPassword.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="flex-1 h-1.5 rounded-full bg-gray-300 overflow-hidden"
                    >
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
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block"
            >
              {t("register.confirmPassword")}
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword")}
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
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-all shadow-sm mt-2 active:scale-[0.98]"
          >
            {loading ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {t("register.or")}
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-gray-500 mt-8 pb-8">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="text-[#c9552c] font-bold">
            {t("register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
