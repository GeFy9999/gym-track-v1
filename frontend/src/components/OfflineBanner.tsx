import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { onSyncQueueChange, pendingMutationCount } from "../lib/syncQueue";

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    pendingMutationCount().then(setPending);
    return onSyncQueueChange(setPending);
  }, []);

  if (isOnline && pending === 0) return null;

  return (
    <div
      className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[70] px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-white ${
        isOnline ? "bg-[#3a9e6e]" : "bg-[#191714]"
      }`}
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {isOnline ? (
        <>
          <RefreshCw size={13} className="animate-spin" />
          {t("offline.syncing", { count: pending })}
        </>
      ) : (
        <>
          <WifiOff size={13} />
          {t("offline.offline")}
        </>
      )}
    </div>
  );
}
