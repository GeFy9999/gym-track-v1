import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { Check, Sparkles } from "lucide-react";
import { PurchaseCancelledError, switchToLoyaltyTier } from "../lib/revenueCat";

type Props = {
  upgradeProductId: string;
  // Called once Google Play accepted the switch (e.g. to refresh the card).
  onActivated?: () => void;
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
  onActivated,
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
      onActivated?.();
    } catch (err) {
      if (!(err instanceof PurchaseCancelledError)) {
        setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  // The price is shown in bold inside the sentence: translate with a
  // marker, then put the bold price where the marker landed.
  const MARK = "__PRICE__";
  const bodyKey = done
    ? "profile.loyaltyTier.doneBody"
    : Capacitor.isNativePlatform()
      ? "profile.loyaltyTier.readyBody"
      : "profile.loyaltyTier.openAppBody";
  const [before, after] = t(bodyKey, { price: MARK }).split(MARK);

  return (
    <div className="bg-[#f7f4ee] rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#23784d]/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={17} className="text-[#23784d]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#23784d] uppercase tracking-wide">
            {done ? t("profile.loyaltyTier.doneTitle") : t("profile.loyaltyTier.readyTitle")}
          </p>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
            {before}
            <span className="font-black text-gray-900">{newPriceLabel}</span>
            {after}
          </p>
        </div>
      </div>
      {!done && Capacitor.isNativePlatform() && (
        <button
          onClick={activate}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[#23784d] disabled:opacity-60 text-white text-sm font-black uppercase tracking-widest py-4 rounded-full shadow-sm active:scale-[0.98] transition-transform"
        >
          <Check size={16} strokeWidth={3} />
          {t("profile.loyaltyTier.activate")}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
