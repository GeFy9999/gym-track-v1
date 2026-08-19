import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Trash2,
  LogOut,
  ChevronRight,
  Scale,
  MailPlus,
  X,
} from "lucide-react";
import { API_URL } from "../lib/api";

export default function ProfilePage() {
  const navigate = useNavigate();

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState(user?.recoveryEmail || "");
  const [weightUnit, setWeightUnit] = useState(user?.weightUnit || "lb");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      setActiveModal(null);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Mot de passe modifié");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecoveryEmail = async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/recovery-email`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recoveryEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.recoveryEmail = recoveryEmail;
        localStorage.setItem("user", JSON.stringify(u));
      }

      setActiveModal(null);
      setSuccess("Courriel de récupération mis à jour");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleWeightUnit = async (unit: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/weight-unit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weightUnit: unit }),
      });

      if (!res.ok) return;

      setWeightUnit(unit);
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.weightUnit = unit;
        localStorage.setItem("user", JSON.stringify(u));
      }

      setActiveModal(null);
      setSuccess(`Unité changée en ${unit}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen px-4">
      {/* Avatar et nom */}
      <div className="flex flex-col items-center pt-8 mb-6">
        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-2xl font-semibold text-gray-900">
          {initials}
        </div>
        <p className="text-lg font-semibold text-gray-900 mt-3">{user?.name}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="bg-green-600 text-gray-900 text-sm font-medium px-4 py-3 rounded-xl mb-4 text-center">
          {success}
        </div>
      )}

      {/* Section Compte */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
        Compte
      </p>
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <button className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-200">
          <Mail size={18} className="text-gray-500" />
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-900">Courriel</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => {
            setActiveModal("password");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-200"
        >
          <Lock size={18} className="text-gray-500" />
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-900">Mot de passe</p>
            <p className="text-xs text-gray-400">
              {user?.authProvider === "google"
                ? "Définir un mot de passe"
                : "Changer le mot de passe"}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <button
          onClick={() => {
            setActiveModal("recovery");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5"
        >
          <MailPlus size={18} className="text-gray-500" />
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-900">Courriel de récupération</p>
            <p className="text-xs text-gray-400">
              {user?.recoveryEmail || "Non configuré"}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Section Préférences */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
        Préférences
      </p>
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <button
          onClick={() => setActiveModal("unit")}
          className="w-full flex items-center gap-3 px-4 py-3.5"
        >
          <Scale size={18} className="text-gray-500" />
          <div className="flex-1 text-left">
            <p className="text-sm text-gray-900">Unité de poids</p>
            <p className="text-xs text-gray-400">
              {weightUnit === "lb" ? "lb (livres)" : "kg (kilogrammes)"}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Zone de danger */}
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-1">
        Zone de danger
      </p>
      <div className="bg-white border border-gray-200 rounded-xl mb-4">
        <button
          onClick={() => {
            setActiveModal("delete");
            setConfirmText("");
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5"
        >
          <Trash2 size={18} className="text-red-400" />
          <div className="flex-1 text-left">
            <p className="text-sm text-red-400">Supprimer le compte</p>
            <p className="text-xs text-gray-400">
              Toutes tes données seront perdues
            </p>
          </div>
        </button>
      </div>

      {/* Bouton déconnexion */}
      <button
        onClick={() => setActiveModal("logout")}
        className="w-full border border-red-500/30 text-red-400 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
      >
        <LogOut size={18} />
        Déconnexion
      </button>

      {/* Modal déconnexion */}
      {activeModal === "logout" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Se déconnecter ?
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Tu devras te reconnecter pour accéder à ton compte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-gray-100 hover:bg-zinc-600 text-gray-900 py-3 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-gray-900 py-3 rounded-xl font-semibold"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changer mot de passe */}
      {activeModal === "password" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-semibold text-gray-900">
                {user?.authProvider === "google"
                  ? "Définir un mot de passe"
                  : "Changer le mot de passe"}
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {user?.authProvider !== "google" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={
                (!currentPassword && user?.authProvider !== "google") ||
                !newPassword
              }
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-gray-900 py-3 rounded-xl font-semibold"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Modal supprimer compte */}
      {activeModal === "delete" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Supprimer le compte ?
            </p>
            <p className="text-sm text-gray-500 text-center mb-4">
              Cette action est irréversible. Toutes tes sessions, exercices et
              données seront définitivement supprimées.
            </p>
            <p className="text-sm text-gray-500 text-center mb-4">
              Tape{" "}
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                SUPPRIMER
              </span>{" "}
              pour confirmer
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-gray-100 hover:bg-zinc-600 text-gray-900 py-3 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "SUPPRIMER"}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-gray-900 py-3 rounded-xl font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "recovery" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-semibold text-gray-900">
                Courriel de récupération
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <label className="text-xs text-gray-500 mb-1 block">
              Courriel alternatif
            </label>
            <input
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="ton@autre-courriel.com"
              className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-orange-500 mb-4"
            />

            <button
              onClick={handleRecoveryEmail}
              disabled={!recoveryEmail}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-gray-900 py-3 rounded-xl font-semibold"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {activeModal === "unit" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-semibold text-gray-900">
                Unité de poids
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleWeightUnit("lb")}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  weightUnit === "lb"
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-gray-200 bg-gray-100/50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <p className="text-sm font-semibold">lb (livres)</p>
                <p className="text-xs text-gray-400 mt-0.5">Système impérial</p>
              </button>

              <button
                onClick={() => handleWeightUnit("kg")}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  weightUnit === "kg"
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-gray-200 bg-gray-100/50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <p className="text-sm font-semibold">kg (kilogrammes)</p>
                <p className="text-xs text-gray-400 mt-0.5">Système métrique</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
