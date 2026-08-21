import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_URL } from "../lib/api";

const passwordRules = [
  { regex: /.{8,}/, label: "Minimum 8 caractères" },
  { regex: /[A-Z]/, label: "Une lettre majuscule" },
  { regex: /[a-z]/, label: "Une lettre minuscule" },
  { regex: /[0-9]/, label: "Un chiffre" },
  { regex: /[^A-Za-z0-9]/, label: "Un caractère spécial (!@#$...)" },
];

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
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-16 px-6">
      <div className="mb-10 text-center">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-16 mx-auto mb-2"
        />
        <p className="text-gray-500 text-sm mt-2">Crée ton compte</p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-6">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="name"
            className="text-m font-semibold text-gray-900 mb-1 block"
          >
            Nom
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.name
                ? "border-red-500"
                : "border-gray-200 focus:border-[#e8622b]"
            }`}
            placeholder="Ton nom"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-m font-semibold text-gray-900 mb-1 block"
          >
            Courriel
          </label>
          <input
            id="email"
            type="text"
            {...register("email")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.email
                ? "border-red-500"
                : "border-gray-200 focus:border-[#e8622b]"
            }`}
            placeholder="ton@courriel.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="relative">
          <label
            htmlFor="password"
            className="text-m font-semibold text-gray-900 mb-1 block"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.password
                ? "border-red-500"
                : "border-gray-200 focus:border-[#e8622b]"
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
          <label
            htmlFor="confirmPassword"
            className="text-m font-semibold text-gray-900 mb-1 block"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            {...register("confirmPassword")}
            className={`w-full bg-white border rounded-2xl px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.confirmPassword
                ? "border-red-500"
                : "border-gray-200 focus:border-[#e8622b]"
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
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md mt-2"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <GoogleLoginButton />

      <p className="text-center text-m text-gray-500 mt-8 pb-8">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-[#e8622b] font-semibold">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
