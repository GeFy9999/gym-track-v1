import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_URL } from "../lib/api";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("login.errors.emailRequired"))
      .email(t("login.errors.emailInvalid")),
    password: z.string().min(1, t("login.errors.passwordRequired")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || t("login.errors.generic"));
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem(`onboardingDone_${result.user.id}`, "true");
      if (result.user.language) {
        i18n.changeLanguage(result.user.language);
      }
      navigate("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t("login.errors.unknown"),
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
          {t("login.subtitle")}
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
              htmlFor="email"
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block"
            >
              {t("login.email")}
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
                placeholder={t("login.emailPlaceholder")}
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
              {t("login.password")}
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
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5 ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-all shadow-sm mt-2 active:scale-[0.98]"
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
          <Link
            to="/forgot-password"
            className="text-xs font-bold text-[#c9552c] uppercase tracking-wide text-center mt-1"
          >
            {t("login.forgotPassword")}
          </Link>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {t("login.or")}
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-gray-500 mt-8">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-[#c9552c] font-bold">
            {t("login.createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
