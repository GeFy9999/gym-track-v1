import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { API_URL } from "../lib/api";

const loginSchema = z.object({
  email: z.string().min(1, "Le courriel est requis").email("Courriel invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        throw new Error(result.error || "Erreur de connexion");
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
        <p className="text-gray-500 text-sm mt-2">Connecte-toi à ton compte</p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-6">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                : "border-gray-200 focus:border-[#c9552c]"
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
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md mt-2"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <Link
          to="/forgot-password"
          className="text-m text-[#e8622b] text-center mt-1"
        >
          Mot de passe oublié ?
        </Link>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <GoogleLoginButton />

      <p className="text-center text-m text-gray-500 mt-8">
        Pas encore de compte ?{" "}
        <Link to="/register" className="text-[#e8622b] font-semibold">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
