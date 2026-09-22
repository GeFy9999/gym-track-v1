import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_URL } from "../lib/api";

const passwordRules = [
  { regex: /.{8,}/, label: "Minimum 8 caractères" },
  { regex: /[A-Z]/, label: "Une lettre majuscule" },
  { regex: /[a-z]/, label: "Une lettre minuscule" },
  { regex: /[0-9]/, label: "Un chiffre" },
  { regex: /[^A-Za-z0-9]/, label: "Un caractère spécial (!@#$...)" },
];

const STRENGTH_LEVELS = [
  { label: "Faible", color: "#c9552c" },
  { label: "Moyen", color: "#e2703a" },
  { label: "Correct", color: "#3a9e6e" },
];

function getPasswordStrength(password: string) {
  const passed = passwordRules.filter((r) => r.regex.test(password)).length;
  if (passed <= 2) return 1;
  if (passed <= 4) return 2;
  return 3;
}

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom ne peut pas dépasser 50 caractères"),
    email: z
      .string()
      .min(1, "Le courriel est requis")
      .email("Courriel invalide"),
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[a-z]/, "Doit contenir une minuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre")
      .regex(/[^A-Za-z0-9]/, "Doit contenir un caractère spécial"),
    confirmPassword: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erreur lors de l'inscription");
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur inconnue");
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
          Crée ton compte
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
              Nom
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
                placeholder="Ton nom"
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
              Courriel
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
                placeholder="ton@courriel.com"
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
              Mot de passe
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
              Confirmer le mot de passe
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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            ou
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <GoogleLoginButton />

        <p className="text-center text-sm text-gray-500 mt-8 pb-8">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-[#c9552c] font-bold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
