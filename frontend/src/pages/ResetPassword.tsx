import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { API_URL } from "../lib/api";

const passwordRules = [
  { regex: /.{8,}/, label: "Minimum 8 caractères" },
  { regex: /[A-Z]/, label: "Une lettre majuscule" },
  { regex: /[a-z]/, label: "Une lettre minuscule" },
  { regex: /[0-9]/, label: "Un chiffre" },
  { regex: /[^A-Za-z0-9]/, label: "Un caractère spécial (!@#$...)" },
];

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[a-z]/, "Doit contenir une minuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre")
      .regex(/[^A-Za-z0-9]/, "Doit contenir un caractère spécial"),
    confirm: z.string().min(1, "Confirme ton mot de passe"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      if (!res.ok) throw new Error(result.error || "Erreur");

      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-red-400 mb-4">Lien invalide</p>
        <Link to="/login" className="text-orange-400 font-semibold text-sm">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-16 px-6">
        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Mot de passe réinitialisé
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Tu peux maintenant te connecter avec ton nouveau mot de passe.
        </p>
        <Link
          to="/login"
          className="bg-orange-500 hover:bg-orange-600 text-gray-900 px-8 py-3 rounded-xl font-semibold"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      {serverError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <label className="text-sm text-gray-500 mb-1 block">
            Nouveau mot de passe
          </label>
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-zinc-500 focus:outline-none transition-colors ${
              errors.password
                ? "border-red-500"
                : "border-gray-200 focus:border-orange-500"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-9 text-gray-400 hover:text-zinc-300 transition-colors"
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
                      className={passes ? "text-green-400" : "text-gray-400"}
                    >
                      {passes ? "✓" : "✗"}
                    </span>
                    <span
                      className={passes ? "text-green-400" : "text-gray-400"}
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
          <label className="text-sm text-gray-500 mb-1 block">Confirmer</label>
          <input
            type={showConfirm ? "text" : "password"}
            {...register("confirm")}
            className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-zinc-500 focus:outline-none transition-colors ${
              errors.confirm
                ? "border-red-500"
                : "border-gray-200 focus:border-orange-500"
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-9 text-gray-400 hover:text-zinc-300 transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {errors.confirm && (
            <p className="text-red-400 text-xs mt-1">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-gray-900 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
        >
          {loading ? "Réinitialisation..." : "Réinitialiser"}
        </button>
      </form>
    </div>
  );
}
