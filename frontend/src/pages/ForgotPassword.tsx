import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "../lib/api";

const forgotSchema = z.object({
  email: z.string().min(1, "Le courriel est requis").email("Courriel invalide"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur");

      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col pt-16 px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Courriel envoyé</h1>
          <p className="text-sm text-zinc-400 mb-8">
            Un lien de réinitialisation a été envoyé à{" "}
            <span className="text-white">{sentEmail}</span>. Vérifie ta boîte de
            réception.
          </p>
          <Link to="/login" className="text-orange-400 font-semibold text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col pt-16 px-6">
      <Link to="/login" className="text-zinc-400 hover:text-white mb-8">
        <ArrowLeft size={24} />
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">
        Mot de passe oublié
      </h1>
      <p className="text-sm text-zinc-400 mb-8">
        Entre ton courriel et on t'envoie un lien pour réinitialiser ton mot de
        passe.
      </p>

      {serverError && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-zinc-400 mb-1 block">Courriel</label>
          <input
            type="text"
            {...register("email")}
            className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none transition-colors ${
              errors.email
                ? "border-red-500"
                : "border-zinc-700 focus:border-orange-500"
            }`}
            placeholder="ton@courriel.com"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
        >
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>
    </div>
  );
}
