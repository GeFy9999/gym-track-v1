import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import i18n from "../i18n";
import { formatAmount } from "../utils/units";

// Phone reminders to activate an earned Google Play loyalty tier (the
// server also emails them, backend services/loyaltyReminders.ts):
//   1. the day after the renewal that unlocked it;
//   2. two days before the next renewal — last chance for it to apply.
// Rescheduled every time fresh user data arrives, and cancelled as soon as
// there's nothing left to activate.

const FIRST_ID = 7101;
const FINAL_ID = 7102;
const DAY = 24 * 60 * 60 * 1000;
// Regular prices (CAD cents), kept in sync with Play Console / Profile.
const BASE_PRICE_CENTS = { month: 499, year: 2999 };

type StoredUser = {
  isPro?: boolean;
  proInterval?: string | null;
  proCurrentPeriodEnd?: string | null;
  loyaltyUpgradeProductId?: string | null;
  loyaltyLastRenewalAt?: string | null;
  loyaltyDiscountCents?: number;
};

export async function syncLoyaltyReminders(user: StoredUser | null) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: FIRST_ID }, { id: FINAL_ID }],
    });

    if (
      !user?.isPro ||
      !user.loyaltyUpgradeProductId ||
      !user.loyaltyLastRenewalAt ||
      !user.proCurrentPeriodEnd
    ) {
      return;
    }

    const now = Date.now();
    const firstAt = new Date(user.loyaltyLastRenewalAt).getTime() + DAY;
    const finalAt = new Date(user.proCurrentPeriodEnd).getTime() - 2 * DAY;

    const yearly = user.proInterval === "year";
    const priceCents =
      BASE_PRICE_CENTS[yearly ? "year" : "month"] - (user.loyaltyDiscountCents ?? 0);
    const price = `${formatAmount(priceCents / 100)}$${
      yearly ? i18n.t("upgrade.perYear") : i18n.t("upgrade.perMonth")
    }`;

    const notifications = [];
    // The first one only if it still comes before the final one.
    if (firstAt > now + 60_000 && firstAt < finalAt) {
      notifications.push({
        id: FIRST_ID,
        title: i18n.t("profile.loyaltyTier.notifFirstTitle"),
        body: i18n.t("profile.loyaltyTier.notifFirstBody", { price }),
        schedule: { at: new Date(firstAt) },
      });
    }
    if (finalAt > now + 60_000) {
      notifications.push({
        id: FINAL_ID,
        title: i18n.t("profile.loyaltyTier.notifFinalTitle"),
        body: i18n.t("profile.loyaltyTier.notifFinalBody", { price }),
        schedule: { at: new Date(finalAt) },
      });
    }
    if (notifications.length === 0) return;

    const { display } = await LocalNotifications.checkPermissions();
    if (display === "denied") return;
    if (display !== "granted") {
      const asked = await LocalNotifications.requestPermissions();
      if (asked.display !== "granted") return;
    }

    await LocalNotifications.schedule({ notifications });
  } catch {
    // Best effort — the server's email reminders still go out.
  }
}
