// Loyalty discount: every consecutive renewal a subscriber pays chips a bit
// off the next one. Cancelling resets the count, so a resubscription always
// starts back at the base price. Annual subscribers get a bigger discount
// per renewal (and a bigger cap) since each renewal is worth far more than a
// monthly one.
export const LOYALTY_CENTS_PER_PERIOD_MONTHLY = 10;
export const LOYALTY_MAX_CENTS_MONTHLY = 100;
export const LOYALTY_CENTS_PER_PERIOD_YEARLY = 100;
export const LOYALTY_MAX_CENTS_YEARLY = 300;

// Kept for any caller that still wants the monthly defaults specifically.
export const LOYALTY_CENTS_PER_PERIOD = LOYALTY_CENTS_PER_PERIOD_MONTHLY;
export const LOYALTY_MAX_CENTS = LOYALTY_MAX_CENTS_MONTHLY;

export function loyaltyCentsPerPeriod(interval: string | null): number {
  return interval === "year"
    ? LOYALTY_CENTS_PER_PERIOD_YEARLY
    : LOYALTY_CENTS_PER_PERIOD_MONTHLY;
}

export function loyaltyMaxCents(interval: string | null): number {
  return interval === "year" ? LOYALTY_MAX_CENTS_YEARLY : LOYALTY_MAX_CENTS_MONTHLY;
}

export function computeLoyaltyDiscountCents(
  periodsPaid: number,
  interval: string | null,
): number {
  return Math.min(
    periodsPaid * loyaltyCentsPerPeriod(interval),
    loyaltyMaxCents(interval),
  );
}

export function loyaltyCouponId(cents: number, interval: string | null): string {
  const suffix = interval === "year" ? "y" : "m";
  return `loyalty_${cents}_cad_${suffix}`;
}

// --- Google Play (RevenueCat) -------------------------------------------
// Google Play can't lower one subscriber's renewal price, so the loyalty
// discount is delivered as price tiers: extra base plans created in Play
// Console in the same subscription, named after the first word of the
// regular base plan with a "-l<tier>" suffix, each priced one discount step
// lower. E.g. regular "monthly-autorenew" → tiers monthly-l1 = 4.89$ …
// monthly-l10 = 3.99$; regular "yearly-autorenew" → yearly-l1 = 28.99$ …
// yearly-l3 = 26.99$. The app offers to move
// the subscriber to the tier they've earned, as a deferred plan change that
// takes effect at their next renewal.

// How many discount steps the subscriber has earned (0 = full price).
export function loyaltyTier(periodsPaid: number, interval: string | null): number {
  return (
    computeLoyaltyDiscountCents(periodsPaid, interval) /
    loyaltyCentsPerPeriod(interval)
  );
}

const TIER_SUFFIX = /-l(\d+)$/;

// RevenueCat reports Google Play subscriptions as "<subscriptionId>:<basePlanId>".
function splitGooglePlayProductId(productId: string) {
  const sep = productId.indexOf(":");
  if (sep === -1) return null;
  return {
    subscriptionId: productId.slice(0, sep),
    basePlanId: productId.slice(sep + 1),
  };
}

// The tier a product id is on (0 for the regular base plan).
export function googlePlayTierOf(productId: string): number {
  const parts = splitGooglePlayProductId(productId);
  const match = parts && TIER_SUFFIX.exec(parts.basePlanId);
  return match ? Number(match[1]) : 0;
}

// The product id of a given (≥ 1) tier of the same subscription, or null
// when the id isn't in "<subscriptionId>:<basePlanId>" form. Works from the
// regular plan ("monthly-autorenew") or from another tier ("monthly-l3").
export function googlePlayTierProductId(
  productId: string,
  tier: number,
): string | null {
  const parts = splitGooglePlayProductId(productId);
  if (!parts || tier < 1) return null;
  const stem = parts.basePlanId.split("-")[0];
  return `${parts.subscriptionId}:${stem}-l${tier}`;
}

// The tier product a Google Play subscriber should move to, if they've
// earned a lower price than the one they're on; otherwise null.
export function googlePlayLoyaltyUpgradeProductId(user: {
  billingProvider: string;
  proProductId: string | null;
  proInterval: string | null;
  loyaltyPeriodsPaid: number;
}): string | null {
  if (user.billingProvider !== "google_play" || !user.proProductId || !user.proInterval) {
    return null;
  }
  const earned = loyaltyTier(user.loyaltyPeriodsPaid, user.proInterval);
  if (earned <= googlePlayTierOf(user.proProductId)) return null;
  return googlePlayTierProductId(user.proProductId, earned);
}
