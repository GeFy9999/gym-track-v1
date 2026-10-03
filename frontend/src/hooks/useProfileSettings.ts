import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/api";
import { useIsPro } from "./useIsPro";
import { useRestTimerContext } from "../contexts/RestTimerContext";

export function useProfileSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isPro, refreshProStatus } = useIsPro();
  const { skip: stopRestTimer } = useRestTimerContext();

  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const loyaltyDiscountCents: number = user?.loyaltyDiscountCents ?? 0;
  const loyaltyPeriodsPaid: number = Math.min(user?.loyaltyPeriodsPaid ?? 0, 10);
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
  const [language, setLanguage] = useState(user?.language || i18n.language || "fr");
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

  useEffect(() => {
    refreshProStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);
  const tourRef3 = useRef<HTMLDivElement>(null);
  const tourRef4 = useRef<HTMLDivElement>(null);
  const tourRefPro = useRef<HTMLDivElement>(null);

  const profileTourSteps = [
    // Shown only to non-Pro users — the upsell banner renders first on the
    // page (right under the header), so its tour step leads too.
    ...(!isPro
      ? [
          {
            title: t("profile.tour.pro.title"),
            description: t("profile.tour.pro.description"),
            refIndex: 5,
          },
        ]
      : []),
    {
      title: t("profile.tour.progressPhotos.title"),
      description: t("profile.tour.progressPhotos.description"),
      refIndex: 0,
    },
    {
      title: t("profile.tour.account.title"),
      description: t("profile.tour.account.description"),
      refIndex: 1,
    },
    {
      title: t("profile.tour.weightUnit.title"),
      description: t("profile.tour.weightUnit.description"),
      refIndex: 2,
    },
    {
      title: t("profile.tour.training.title"),
      description: t("profile.tour.training.description"),
      refIndex: 3,
      tooltipPosition: "above" as const,
    },
    {
      title: t("profile.tour.dangerZone.title"),
      description: t("profile.tour.dangerZone.description"),
      refIndex: 4,
      tooltipPosition: "above" as const,
    },
  ];

  const handleLogout = () => {
    stopRestTimer();
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
      if (!res.ok) throw new Error(data.error || t("profile.errorGeneric"));
      setActiveModal(null);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(t("profile.toastPasswordChanged"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.errorGeneric"));
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
      if (!res.ok) throw new Error(data.error || t("profile.errorGeneric"));
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        u.recoveryEmail = recoveryEmail;
        localStorage.setItem("user", JSON.stringify(u));
      }
      setActiveModal(null);
      setSuccess(t("profile.toastRecoveryEmailUpdated"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.errorGeneric"));
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
      setSuccess(t("profile.toastUnitChanged", { unit }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguage = async (lang: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/language`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: lang }),
      });
      if (!res.ok) return;
      setLanguage(lang);
      i18n.changeLanguage(lang);
      const s = localStorage.getItem("user");
      if (s) {
        const u = JSON.parse(s);
        u.language = lang;
        localStorage.setItem("user", JSON.stringify(u));
      }
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
      setSuccess(t("profile.toastRestTimerUpdated"));
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

  return {
    user,
    initials,
    loyaltyDiscountCents,
    loyaltyPeriodsPaid,
    isPro,
    activeModal,
    setActiveModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmText,
    setConfirmText,
    error,
    setError,
    success,
    recoveryEmail,
    setRecoveryEmail,
    weightUnit,
    language,
    restTimerSeconds,
    restTimerEnabled,
    barbellModeEnabled,
    customMinutes,
    setCustomMinutes,
    customSeconds,
    setCustomSeconds,
    customTotalSeconds,
    tourRef0,
    tourRef1,
    tourRef2,
    tourRef3,
    tourRef4,
    tourRefPro,
    profileTourSteps,
    handleLogout,
    handleChangePassword,
    handleDeleteAccount,
    handleRecoveryEmail,
    handleWeightUnit,
    handleLanguage,
    handleRestTimer,
    handleRestTimerEnabled,
    handleBarbellModeEnabled,
    formatRestTimer,
  };
}
