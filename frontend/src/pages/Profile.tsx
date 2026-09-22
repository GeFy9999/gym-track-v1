import { useState, useRef } from "react";
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
  Camera,
  Timer,
  Dumbbell,
  Download,
} from "lucide-react";
import { API_URL } from "../lib/api";
import TourOverlay from "../components/TourOverlay";

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
  const [restTimerSeconds, setRestTimerSeconds] = useState(
    user?.restTimerSeconds || 120,
  );
  const [restTimerEnabled, setRestTimerEnabled] = useState<boolean>(
    user?.restTimerEnabled ?? false,
  );
  const [barbellModeEnabled, setBarbellModeEnabled] = useState<boolean>(
    user?.barbellModeEnabled ?? false,
  );
  const [customMinutes, setCustomMinutes] = useState("");
  const [customSeconds, setCustomSeconds] = useState("");
  const customTotalSeconds =
    (Number(customMinutes) || 0) * 60 + (Number(customSeconds) || 0);

  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);
  const tourRef3 = useRef<HTMLDivElement>(null);
  const tourRef4 = useRef<HTMLDivElement>(null);

  const profileTourSteps = [
    {
      title: "Photos de progression",
      description:
        "Prends des photos régulièrement pour visualiser ta progression physique dans le temps.",
      refIndex: 0,
    },
    {
      title: "Compte",
      description:
        "Gère ton courriel, ton mot de passe et un courriel de récupération en cas de perte d'accès.",
      refIndex: 1,
    },
    {
      title: "Unité de poids",
      description:
        "Choisis lb ou kg — tout l'app (séances, stats, historique) s'adapte à ton choix.",
      refIndex: 2,
    },
    {
      title: "Entraînement",
      description:
        "Active le minuteur de repos automatique et sa durée par défaut, ainsi que le mode barre pour calculer les plaques à charger.",
      refIndex: 3,
      tooltipPosition: "above" as const,
    },
    {
      title: "Zone de danger",
      description:
        "Supprime ton compte et toutes tes données. Cette action est irréversible.",
      refIndex: 4,
      tooltipPosition: "above" as const,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("weightSnooze");
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

  const handleRestTimer = async (seconds: number) => {
    if (!seconds || seconds < 5 || seconds > 600) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/rest-timer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restTimerSeconds: seconds }),
      });
      if (!res.ok) return;
      setRestTimerSeconds(seconds);
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        u.restTimerSeconds = seconds;
        localStorage.setItem("user", JSON.stringify(u));
      }
      setActiveModal(null);
      setCustomMinutes("");
      setCustomSeconds("");
      setSuccess("Minuteur de repos mis à jour");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestTimerEnabled = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/rest-timer-enabled`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restTimerEnabled: enabled }),
      });
      if (!res.ok) return;
      setRestTimerEnabled(enabled);
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        u.restTimerEnabled = enabled;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBarbellModeEnabled = async (enabled: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/barbell-mode-enabled`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barbellModeEnabled: enabled }),
      });
      if (!res.ok) return;
      setBarbellModeEnabled(enabled);
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        u.barbellModeEnabled = enabled;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatRestTimer = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes} min` : `${minutes} min ${rest}`;
  };

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen">
      {/* Header card */}
      <div
        className="px-5 pt-8 pb-6 flex items-center gap-4"
        style={{ background: "#191714" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: "#c9552c" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-white uppercase tracking-wide truncate">
            {user?.name}
          </p>
          <p className="text-sm text-white/40 truncate">{user?.email}</p>
        </div>
      </div>

      <div className="px-5 pt-5">

      {success && (
        <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl mb-4 text-center">
          {success}
        </div>
      )}

      {/* Progression */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Progression
      </p>
      <div ref={tourRef0} className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <button
          onClick={() => navigate("/progression")}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Camera size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Photos de progression
          </p>
          <span className="text-[10px] font-bold text-gray-600 uppercase bg-white/60 px-2.5 py-1 rounded-full">
            Voir
          </span>
          <ChevronRight size={16} className="text-[#c9552c] flex-shrink-0" />
        </button>
      </div>

      {/* Données */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Données
      </p>
      <div className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <button
          onClick={() => navigate("/import")}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Download size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Importer des données
          </p>
          <span className="text-[10px] font-bold text-gray-600 uppercase bg-white/60 px-2.5 py-1 rounded-full">
            CSV
          </span>
          <ChevronRight size={16} className="text-[#c9552c] flex-shrink-0" />
        </button>
      </div>

      {/* Compte */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Compte
      </p>
      <div ref={tourRef1} className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <div className="w-full flex items-center gap-3 px-4 py-4 border-b border-black/5">
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Mail size={16} className="text-[#c9552c]" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-gray-900 uppercase">
              Courriel
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveModal("password");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-4 border-b border-black/5"
        >
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Lock size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Mot de passe
          </p>
          <span className="text-[10px] font-bold uppercase bg-[#c9552c]/10 text-[#c9552c] px-2.5 py-1 rounded-full whitespace-nowrap">
            {user?.authProvider === "google" ? "Non défini" : "Modifier"}
          </span>
          <ChevronRight size={16} className="text-[#c9552c] flex-shrink-0" />
        </button>

        <button
          onClick={() => {
            setActiveModal("recovery");
            setError(null);
          }}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <MailPlus size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Courriel de récupération
          </p>
          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${
              user?.recoveryEmail
                ? "bg-white/60 text-gray-600"
                : "bg-[#c9552c]/10 text-[#c9552c]"
            }`}
          >
            {user?.recoveryEmail ? "Configuré" : "Non conf."}
          </span>
          <ChevronRight size={16} className="text-[#c9552c]" />
        </button>
      </div>

      {/* Préférences */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Préférences
      </p>
      <div ref={tourRef2} className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <div className="w-full flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Scale size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Unité de poids
          </p>
          <div className="relative flex w-28 bg-gray-300 rounded-full p-1 flex-shrink-0">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#191714] transition-transform duration-200 ease-out"
              style={{
                transform:
                  weightUnit === "lb" ? "translateX(100%)" : "translateX(0)",
              }}
            />
            <button
              onClick={() => handleWeightUnit("kg")}
              className={`relative z-10 flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
                weightUnit === "kg" ? "text-white" : "text-gray-500"
              }`}
            >
              Kg
            </button>
            <button
              onClick={() => handleWeightUnit("lb")}
              className={`relative z-10 flex-1 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
                weightUnit === "lb" ? "text-white" : "text-gray-500"
              }`}
            >
              Lb
            </button>
          </div>
        </div>
      </div>

      {/* Entraînement */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Entraînement
      </p>
      <div ref={tourRef3} className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <div className="w-full flex items-center gap-3 px-4 py-4 border-b border-black/5">
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Timer size={16} className="text-[#c9552c]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900 uppercase">
              Minuteur de repos automatique
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Démarre dès qu'un set est marqué complété
            </p>
          </div>
          <button
            onClick={() => handleRestTimerEnabled(!restTimerEnabled)}
            className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${
              restTimerEnabled ? "bg-[#3a9e6e]" : "bg-gray-300"
            }`}
            aria-label="Activer le minuteur de repos automatique"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                restTimerEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <button
          onClick={() => restTimerEnabled && setActiveModal("restTimer")}
          disabled={!restTimerEnabled}
          className="w-full flex items-center gap-3 px-4 py-4 border-b border-black/5 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Timer size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            Durée par défaut
          </p>
          <span className="text-[10px] font-bold text-gray-600 uppercase bg-white/60 px-2.5 py-1 rounded-full">
            {formatRestTimer(restTimerSeconds)}
          </span>
          <ChevronRight size={16} className="text-[#c9552c]" />
        </button>

        <div className="w-full flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={16} className="text-[#c9552c]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900 uppercase">
              Mode barre
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Saisis le poids de chaque côté de la barre
            </p>
          </div>
          <button
            onClick={() => handleBarbellModeEnabled(!barbellModeEnabled)}
            className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${
              barbellModeEnabled ? "bg-[#3a9e6e]" : "bg-gray-300"
            }`}
            aria-label="Activer le mode barre"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                barbellModeEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Zone de danger */}
      <p className="text-xs text-gray-900 uppercase tracking-widest font-bold mb-2 px-1">
        Zone de danger
      </p>
      <div ref={tourRef4} className="bg-[#ece7dd] rounded-2xl mb-6 shadow-sm">
        <button
          onClick={() => {
            setActiveModal("delete");
            setConfirmText("");
          }}
          className="w-full flex items-center gap-3 px-4 py-4"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-red-500 uppercase">
              Supprimer le compte
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Toutes tes données seront perdues
            </p>
          </div>
        </button>
      </div>

      {/* Déconnexion */}
      <button
        onClick={() => setActiveModal("logout")}
        className="w-full text-white py-4 rounded-full font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-sm active:opacity-90 transition-opacity"
        style={{ background: "#191714" }}
      >
        <LogOut size={16} className="text-[#e2703a]" />
        Se déconnecter
      </button>

      </div>

      {/* Modal déconnexion */}
      {activeModal === "logout" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
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

      {/* Modal timer de repos */}
      {activeModal === "restTimer" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <p className="text-base font-bold text-gray-900">
                Minuteur de repos
              </p>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setCustomMinutes("");
                  setCustomSeconds("");
                }}
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {[30, 60, 90, 120].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => handleRestTimer(seconds)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                    restTimerSeconds === seconds
                      ? "border-[#c9552c] bg-[#c9552c]/5 text-[#c9552c]"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {formatRestTimer(seconds)}
                  </p>
                </button>
              ))}
            </div>
            <label className="text-xs text-gray-500 mb-1 block">
              Durée personnalisée
            </label>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-center text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-[#c9552c]"
                />
                <p className="text-[11px] text-gray-500 text-center mt-1">
                  minutes
                </p>
              </div>
              <span className="text-gray-300 font-semibold pb-5">:</span>
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-center text-gray-900 font-semibold placeholder-gray-400 focus:outline-none focus:border-[#c9552c]"
                />
                <p className="text-[11px] text-gray-500 text-center mt-1">
                  secondes
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRestTimer(customTotalSeconds)}
              disabled={customTotalSeconds < 5 || customTotalSeconds > 600}
              className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      <TourOverlay
        tourKey="profile"
        steps={profileTourSteps}
        refs={[tourRef0, tourRef1, tourRef2, tourRef3, tourRef4]}
      />
    </div>
  );
}
