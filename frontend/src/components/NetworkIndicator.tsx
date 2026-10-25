import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { onNetworkActivity } from "../lib/networkActivity";
import Spinner from "./Spinner";

// Only for requests that take a noticeable while — a fast answer shouldn't
// flash a spinner.
const SHOW_AFTER_MS = 500;

// Small floating spinner at the top of the screen while the app waits on
// the network (see lib/networkActivity.ts).
export default function NetworkIndicator() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => onNetworkActivity((n) => setBusy(n > 0)), []);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timeout = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timeout);
  }, [busy]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[65] pointer-events-none animate-fade-in"
      style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
        <Spinner size={22} label={t("common.loading")} />
      </div>
    </div>
  );
}
