import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trash2, CheckCircle2 } from "lucide-react";
import { API_URL } from "../lib/api";

// Public, standalone web page for requesting account deletion — required by
// Google Play policy alongside the in-app deletion flow (Profile.tsx), so
// users can request deletion without having the app installed. Content is
// hand-rolled bilingual (matching PrivacyPolicy.tsx/TermsOfService.tsx)
// rather than routed through i18n JSON, since this page isn't reachable from
// inside the app's normal navigation.
export default function AccountDeletionPage() {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const confirmWord = isFrench ? "SUPPRIMER" : "DELETE";
  const canSubmit = email && password && confirmText === confirmWord && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(
          loginData.error ||
            (isFrench
              ? "Courriel ou mot de passe incorrect."
              : "Incorrect email or password."),
        );
      }

      const deleteRes = await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      if (!deleteRes.ok) {
        throw new Error(
          isFrench
            ? "La suppression a échoué. Réessaie plus tard."
            : "Deletion failed. Please try again later.",
        );
      }

      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isFrench
            ? "Une erreur est survenue."
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
          <CheckCircle2 size={24} className="text-[#3a9e6e]" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">
          {isFrench ? "Compte supprimé" : "Account deleted"}
        </h1>
        <p className="text-sm text-gray-500 max-w-sm">
          {isFrench
            ? "Ton compte et toutes tes données ont été supprimés définitivement."
            : "Your account and all your data have been permanently deleted."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col pt-8 px-6 pb-16">
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

      <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center mb-3">
        <Trash2 size={20} className="text-red-500" />
      </div>

      <h1 className="text-[24px] font-black text-gray-900 leading-tight mb-2">
        {isFrench ? "Supprimer mon compte" : "Delete my account"}
      </h1>

      <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-md">
        {isFrench
          ? "Cette page te permet de demander la suppression de ton compte GymsTrack et de toutes les données associées (profil, historique d'entraînement, photos de progression) sans avoir besoin d'installer l'application. Cette action est irréversible."
          : "This page lets you request deletion of your GymsTrack account and all associated data (profile, workout history, progress photos) without needing to install the app. This action is irreversible."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-4 max-w-md">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 max-w-md w-full">
        <div>
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
            {isFrench ? "Courriel" : "Email"}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#ece7dd] rounded-full px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none"
            placeholder={isFrench ? "ton@courriel.com" : "you@email.com"}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
            {isFrench ? "Mot de passe" : "Password"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#ece7dd] rounded-full px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1.5 block">
            {isFrench
              ? `Tape ${confirmWord} pour confirmer`
              : `Type ${confirmWord} to confirm`}
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmWord}
            className="w-full bg-white border border-gray-200 rounded-full px-4 py-3.5 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-red-500 disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm mt-2"
        >
          {loading
            ? isFrench
              ? "Suppression..."
              : "Deleting..."
            : isFrench
              ? "Supprimer définitivement"
              : "Permanently delete"}
        </button>
      </div>
    </div>
  );
}
