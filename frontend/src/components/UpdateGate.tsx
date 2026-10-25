import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import {
  AppUpdate,
  AppUpdateAvailability,
} from "@capawesome/capacitor-app-update";

// Blocks the whole app while a newer version is waiting on the Play Store.
// Only works for installs that came from Play (not debug builds): any error
// from the check — sideloaded APK, no network, no Play services — lets the
// user through rather than locking them out of their workouts.
export default function UpdateGate() {
  const { t } = useTranslation();
  const [updateRequired, setUpdateRequired] = useState(false);
  const [immediateAllowed, setImmediateAllowed] = useState(false);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const check = async () => {
      try {
        const info = await AppUpdate.getAppUpdateInfo();
        const pending =
          info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE ||
          info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;
        setUpdateRequired(pending);
        setImmediateAllowed(info.immediateUpdateAllowed === true);
      } catch {
        setUpdateRequired(false);
      }
    };

    check();
    // Re-check on resume: the user may have updated from the Play Store
    // in the background, or a new release may have shipped meanwhile.
    const listener = CapacitorApp.addListener("resume", check);
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  const startUpdate = async () => {
    try {
      if (immediateAllowed) {
        // Play's full-screen flow; the app restarts itself once installed.
        // If the user backs out, the gate simply stays up.
        await AppUpdate.performImmediateUpdate();
        return;
      }
    } catch {
      // Fall through to the store page.
    }
    try {
      await AppUpdate.openAppStore();
    } catch {
      // Nothing more we can do from here.
    }
  };

  if (!updateRequired) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#faf6f1] flex flex-col items-center justify-center px-8 text-center"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-gate-title"
    >
      <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mb-6">
        <Download size={28} className="text-[#c9552c]" />
      </div>
      <h1
        id="update-gate-title"
        className="text-2xl font-black text-[#191714] mb-3"
      >
        {t("update.title")}
      </h1>
      <p className="text-sm text-[#191714]/70 mb-8 max-w-sm">
        {t("update.message")}
      </p>
      <button
        type="button"
        onClick={startUpdate}
        className="w-full max-w-sm bg-[#c9552c] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm transition-all shadow-sm active:scale-[0.98]"
      >
        {t("update.cta")}
      </button>
    </div>
  );
}
