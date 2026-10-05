import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Sparkles } from "lucide-react";
import { PurchaseCancelledError, switchToLoyaltyTier } from "../lib/revenueCat";

type Props = {
  upgradeProductId: string;
  currentProductId: string;
  newPriceLabel: string;
};

// Remembers a tier switch already accepted in Google Play, so the button
// doesn't come back while the RevenueCat webhook is still on its way.
const REQUESTED_KEY = "loyaltyTierRequested";

// Google Play subscribers only: their earned loyalty discount is a cheaper
// price tier they have to switch to (Google Play can't discount a renewal
// on its own). Accepting it schedules the switch for the next renewal.
export default function LoyaltyTierBanner({
  upgradeProductId,
  currentProductId,
  newPriceLabel,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(REQUESTED_KEY) === upgradeProductId;
    } catch {
      return false;
    }
  });

  const activate = async () => {
    setError(null);
    setLoading(true);
    try {
      await switchToLoyaltyTier(upgradeProductId, currentProductId);
      try {
        localStorage.setItem(REQUESTED_KEY, upgradeProductId);
      } catch {
        // Only a convenience — the webhook will catch up either way.
      }
      setDone(true);
    } catch (err) {
      if (!(err instanceof PurchaseCancelledError)) {
        setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 bg-[#3a9e6e]/10 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <Sparkles size={15} className="text-[#3a9e6e] flex-shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-[#2c7a55]">
          {done
            ? t("profile.loyaltyTier.done", { price: newPriceLabel })
            : Capacitor.isNativePlatform()
              ? t("profile.loyaltyTier.ready", { price: newPriceLabel })
              : t("profile.loyaltyTier.openApp", { price: newPriceLabel })}
        </p>
      </div>
      {!done && Capacitor.isNativePlatform() && (
        <button
          onClick={activate}
          disabled={loading}
          className="mt-2.5 w-full bg-[#3a9e6e] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wide py-2.5 rounded-full"
        >
          {t("profile.loyaltyTier.activate")}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
