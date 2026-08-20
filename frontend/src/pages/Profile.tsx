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
        body: JSON.stringify({ currentPassword, newPassword }),
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
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
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
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
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

  const truncateEmail = (email: string) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (local.length <= 10) return email;
    return `${local.slice(0, 10)}...@${domain}`;
  };

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
      {/* Profile card */}
      <div className="pt-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#c9552c]/8" />
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #f09040 0%, #e8622b 50%, #d94e28 100%)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mb-4 text-center">
          {success}
        </div>
      )}

      {/* Compte */}
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 px-1">
        Compte
      </p>
      <div className="bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
        <div className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
            <Mail size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-medium text-gray-900">
            Courriel
          </p>
          <p className="text-sm text-gray-400">
            {truncateEmail(user?.email || "")}
          </p>
          <span className="w-4 flex-shrink-0" />
        </div>

        <button
          onClick={() => {
            setActiveModal("password");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100"
        >
          <div className="w-9 h-9 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-medium text-gray-900">
            Mot de passe
          </p>
          <p className="text-sm text-gray-400">
            {user?.authProvider === "google" ? "Non défini" : "Modifier"}
          </p>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </button>

        <button
          onClick={() => {
            setActiveModal("recovery");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
            <MailPlus size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-medium text-gray-900">
            Courriel de récupération
          </p>
          <p className="text-sm text-gray-400">
            {user?.recoveryEmail ? "Configuré" : "Non configuré"}
          </p>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Préférences */}
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 px-1">
        Préférences
      </p>
      <div className="bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
        <button
          onClick={() => setActiveModal("unit")}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
            <Scale size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-medium text-gray-900">
            Unité de poids
          </p>
          <p className="text-sm text-gray-400">
            {weightUnit === "lb" ? "lb (livres)" : "kg (kilogrammes)"}
          </p>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Zone de danger */}
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 px-1">
        Zone de danger
      </p>
      <div className="bg-white border border-gray-200 rounded-2xl mb-6 shadow-sm">
        <button
          onClick={() => {
            setActiveModal("delete");
            setConfirmText("");
          }}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-red-500">
              Supprimer le compte
            </p>
            <p className="text-xs text-gray-400">
              Toutes tes données seront perdues
            </p>
          </div>
        </button>
      </div>

      {/* Déconnexion */}
      <button
        onClick={() => setActiveModal("logout")}
        className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut size={18} className="text-gray-500" />
        Déconnexion
      </button>

      {/* Modal déconnexion */}
      {activeModal === "logout" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-gray-900 text-center mb-2">
              Se déconnecter ?
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              Tu devras te reconnecter pour accéder à ton compte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal mot de passe */}
      {activeModal === "password" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-bold text-gray-900">
                {user?.authProvider === "google"
                  ? "Définir un mot de passe"
                  : "Changer le mot de passe"}
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#c9552c]"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#c9552c]"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={
                (!currentPassword && user?.authProvider !== "google") ||
                !newPassword
              }
              className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Modal supprimer */}
      {activeModal === "delete" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-gray-900 text-center mb-2">
              Supprimer le compte ?
            </p>
            <p className="text-sm text-gray-400 text-center mb-4">
              Cette action est irréversible. Toutes tes sessions, exercices et
              données seront définitivement supprimées.
            </p>
            <p className="text-sm text-gray-400 text-center mb-4">
              Tape{" "}
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                SUPPRIMER
              </span>{" "}
              pour confirmer
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "SUPPRIMER"}
                className="flex-1 bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal recovery */}
      {activeModal === "recovery" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-bold text-gray-900">
                Courriel de récupération
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
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
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#c9552c] mb-4"
            />
            <button
              onClick={handleRecoveryEmail}
              disabled={!recoveryEmail}
              className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Modal unité */}
      {activeModal === "unit" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-bold text-gray-900">
                Unité de poids
              </p>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleWeightUnit("lb")}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  weightUnit === "lb"
                    ? "border-[#c9552c] bg-[#c9552c]/5 text-[#c9552c]"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                <p className="text-sm font-semibold">lb (livres)</p>
                <p className="text-xs text-gray-400 mt-0.5">Système impérial</p>
              </button>
              <button
                onClick={() => handleWeightUnit("kg")}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  weightUnit === "kg"
                    ? "border-[#c9552c] bg-[#c9552c]/5 text-[#c9552c]"
                    : "border-gray-200 bg-gray-50 text-gray-700"
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
