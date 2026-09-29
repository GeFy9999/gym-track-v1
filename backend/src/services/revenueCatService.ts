import { prisma } from "../prisma.js";
import { getUserById } from "../repositories/databaseRepository.js";

// Product IDs are ones we chose ourselves when creating the subscriptions in
// Google Play Console — kept predictable so we can derive the billing
// interval from them without an extra lookup. Matches both "annual" and
// "yearly" naming since the RevenueCat product catalog uses "yearly".
function intervalFromProductId(productId: string | undefined): string | null {
  if (!productId) return null;
  if (productId.includes("annual") || productId.includes("year")) return "year";
  if (productId.includes("monthly") || productId.includes("month")) return "month";
  return null; // lifetime (one-time) has no recurring interval
}

type RevenueCatEvent = {
  type: string;
  app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number | null;
};

export async function handleRevenueCatWebhook(
  authHeader: string | undefined,
  body: { event?: RevenueCatEvent },
) {
  if (!process.env.REVENUECAT_WEBHOOK_SECRET) {
    throw new Error("RevenueCat n'est pas configuré (REVENUECAT_WEBHOOK_SECRET manquant)");
  }
  if (authHeader !== process.env.REVENUECAT_WEBHOOK_SECRET) {
    throw new Error("Authentification webhook invalide");
  }

  const event = body.event;
  if (!event?.app_user_id) return;

  // app_user_id is our own User.id — set via Purchases.logIn() on the client
  // right after our own login, so RevenueCat never invents its own identity.
  const user = await getUserById(event.app_user_id);
  if (!user) return;

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "SUBSCRIPTION_EXTENDED":
    case "NON_RENEWING_PURCHASE": {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          billingProvider: "google_play",
          proInterval: intervalFromProductId(event.product_id),
          proCurrentPeriodEnd: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null,
        },
      });
      break;
    }

    // CANCELLATION only means auto-renew was turned off (or a refund was
    // issued) — access continues until the period actually ends. EXPIRATION
    // is the real "access ends now" signal, mirroring Stripe's
    // customer.subscription.deleted.
    case "EXPIRATION": {
      // A stale event for a user who has since moved to a different
      // provider (e.g. switched to Stripe) shouldn't clobber that.
      if (user.billingProvider !== "google_play") break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proCurrentPeriodEnd: null,
          proInterval: null,
        },
      });
      break;
    }
  }
}
