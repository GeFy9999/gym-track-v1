import { prisma } from "../prisma.js";
import { getUserById } from "../repositories/databaseRepository.js";
import { googlePlayTierOf } from "../utils/loyalty.js";

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
  id?: string;
  type: string;
  app_user_id?: string;
  product_id?: string;
  // PRODUCT_CHANGE only: product_id is the OLD product, this the new one.
  new_product_id?: string | null;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
  // "SANDBOX" for Google Play test purchases (license testers), whose
  // subscriptions renew every few minutes instead of every month/year.
  // Deliberately NOT excluded from the loyalty count below: it lets a
  // tester see the discount tiers in minutes. Only test accounts ever get
  // sandbox events; real subscribers' renewals arrive as "PRODUCTION".
  environment?: string;
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
      const productId =
        (event.type === "PRODUCT_CHANGE" && event.new_product_id) ||
        event.product_id;
      const interval = intervalFromProductId(productId);
      // Loyalty price tier of the product (0 = regular price).
      const tier = productId ? googlePlayTierOf(productId) : 0;
      // On a tier the streak is at least that tier: it was earned to get
      // there, and must never be lost by the switch itself.
      const keepStreak = { loyaltyPeriodsPaid: Math.max(user.loyaltyPeriodsPaid, tier) };

      // Loyalty streak, mirroring Stripe: a brand-new subscription starts
      // at 0, switching monthly <-> yearly restarts at 0, and each paid
      // renewal adds one — counted once per event, since RevenueCat
      // redelivers a webhook it didn't get a 200 for. Moving to a loyalty
      // tier never resets it: Google Play replaces the purchase for that,
      // which RevenueCat may report as a brand-new purchase (seen on a real
      // device: the streak dropped to 0 right after activating a discount).
      let loyalty: {
        loyaltyPeriodsPaid?: number;
        loyaltyLastInvoiceId?: string;
        loyaltyLastRenewalAt?: Date;
      } = {};
      if (event.type === "INITIAL_PURCHASE" && interval) {
        loyalty = tier > 0 ? keepStreak : { loyaltyPeriodsPaid: 0 };
      } else if (
        event.type === "PRODUCT_CHANGE" &&
        user.proInterval &&
        interval &&
        user.proInterval !== interval
      ) {
        loyalty = { loyaltyPeriodsPaid: 0 };
      } else if (event.type === "PRODUCT_CHANGE" && tier > 0) {
        loyalty = keepStreak;
      } else if (
        event.type === "RENEWAL" &&
        interval &&
        (!event.id || event.id !== user.loyaltyLastInvoiceId)
      ) {
        // From at least the tier they're on, so a streak that was wrongly
        // reset by an earlier tier switch repairs itself on this renewal.
        loyalty = {
          loyaltyPeriodsPaid: Math.max(user.loyaltyPeriodsPaid, tier) + 1,
          ...(event.id ? { loyaltyLastInvoiceId: event.id } : {}),
          // Starts the reminder clock (services/loyaltyReminders.ts).
          loyaltyLastRenewalAt: new Date(event.event_timestamp_ms ?? Date.now()),
        };
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          billingProvider: "google_play",
          proInterval: interval,
          proProductId: interval ? (productId ?? null) : null,
          proCurrentPeriodEnd: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null,
          // A Google Play subscription uses up the account's one free trial
          // too (lifetime, which has no interval, doesn't).
          ...(interval ? { hasUsedTrial: true } : {}),
          ...loyalty,
        },
      });
      break;
    }

    // CANCELLATION only means auto-renew was turned off (or a refund was
    // issued) — access continues until the period actually ends. EXPIRATION
    // is the real "access ends now" signal, mirroring Stripe's
    // customer.subscription.deleted (which also resets the loyalty streak).
    case "EXPIRATION": {
      // A stale event for a user who has since moved to a different
      // provider (e.g. switched to Stripe) shouldn't clobber that.
      if (user.billingProvider !== "google_play") break;
      // Nor the end of a purchase that was replaced (moving to a loyalty
      // tier, or monthly <-> yearly): the user is already on the new one.
      if (
        event.product_id &&
        user.proProductId &&
        event.product_id !== user.proProductId
      ) {
        break;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proCurrentPeriodEnd: null,
          proInterval: null,
          proProductId: null,
          loyaltyPeriodsPaid: 0,
        },
      });
      break;
    }
  }
}
