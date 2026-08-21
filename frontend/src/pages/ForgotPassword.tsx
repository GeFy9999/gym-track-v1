import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "../lib/api";

const forgotSchema = z.object({
  email: z.string().min(1, "Le courriel est requis").email("Courriel invalide"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

const COOLDOWN_SECONDS = 300;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sendEmail = useCallback(async (email: string) => {
    setServerError(null);
    setLoading(true);
    setResendSuccess(false);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");

      setSentEmail(email);
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = async (data: ForgotForm) => {
    await sendEmail(data.email);
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading || !sentEmail) return;
    await sendEmail(sentEmail);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
        <Link
          to="/login"
          className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mb-4"
        >
          <ArrowLeft size={16} className="text-gray-700" />
        </Link>

        <div className="text-center mt-8">
          <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-[#c9552c]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Courriel envoyé
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Un lien de réinitialisation a été envoyé à{" "}
            <span className="text-gray-900 font-semibold">{sentEmail}</span>.
            Vérifie ta boîte de réception.
          </p>
          <Link to="/login" className="text-[#c9552c] font-semibold text-sm">
            Retour à la connexion
          </Link>
        </div>

        {resendSuccess && (
          <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mt-6 text-center">
            Courriel renvoyé avec succès
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <Mail size={48} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 text-center">
            Tu ne reçois rien ? Vérifie tes indésirables ou
          </p>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="mt-1"
          >
            {cooldown > 0 ? (
              <span className="text-sm text-gray-400">
                Réessayer dans {formatCooldown(cooldown)}
              </span>
            ) : (
              <span className="text-sm text-[#c9552c] font-semibold">
                {loading ? "Envoi..." : "réessaie"}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6">
      <Link
        to="/login"
        className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mb-4"
      >
        <ArrowLeft size={16} className="text-gray-700" />
      </Link>

      <div className="text-center mb-6">
        <img
          src="/LogoGymsTrack5.webp"
          alt="GymsTrack"
          className="h-14 mx-auto"
        />
      </div>

      <div className="w-11 h-11 rounded-xl bg-[#c9552c]/10 flex items-center justify-center mb-3">
        <Lock size={20} className="text-[#c9552c]" />
      </div>

      <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-1">
        Mot de passe oublié
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Entre ton courriel et on t'envoie un lien pour réinitialiser ton mot de
        passe.
      </p>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="text-m font-semibold text-gray-900 mb-1 block">
            Courriel
          </label>
          <input
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Mail size={64} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 text-center">
          Tu ne reçois rien ? Vérifie tes indésirables ou{" "}
          <span className="text-[#c9552c] font-semibold">réessaie</span>
        </p>
      </div>
    </div>
  );
}
