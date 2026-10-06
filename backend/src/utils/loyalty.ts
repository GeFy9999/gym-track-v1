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
// Console in the same subscription, named "monthly-l<tier>" or
// "yearly-l<tier>" after the billing period (whatever the regular base
// plan is called), each priced one discount step lower:
//   gymstrack_pro_monthly:monthly-autorenew → monthly-l1 = 4.89$ … monthly-l10 = 3.99$
//   gymstrack_pro_yearly:gymstrack-pro-yearly → yearly-l1 = 28.99$ … yearly-l3 = 26.99$ The app offers to move
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
// when the id isn't in "<subscriptionId>:<basePlanId>" form or its period
// can't be told. Works from the regular plan or from another tier.
export function googlePlayTierProductId(
  productId: string,
  tier: number,
): string | null {
  const parts = splitGooglePlayProductId(productId);
  if (!parts || tier < 1) return null;
  const lower = productId.toLowerCase();
  const prefix =
    lower.includes("year") || lower.includes("annual")
      ? "yearly"
      : lower.includes("month")
        ? "monthly"
        : null;
  return prefix ? `${parts.subscriptionId}:${prefix}-l${tier}` : null;
}

// The discount the subscriber actually pays less right now. Stripe applies
// the earned discount by itself (coupon), so it's the earned one; a Google
// Play subscriber only pays less once on a tier — the one they're on.
export function activeLoyaltyDiscountCents(user: {
  billingProvider: string;
  proProductId: string | null;
  proInterval: string | null;
  loyaltyPeriodsPaid: number;
}): number {
  const earned = computeLoyaltyDiscountCents(user.loyaltyPeriodsPaid, user.proInterval);
  if (user.billingProvider !== "google_play") return earned;
  if (!user.proProductId) return 0;
  return Math.min(
    googlePlayTierOf(user.proProductId) * loyaltyCentsPerPeriod(user.proInterval),
    loyaltyMaxCents(user.proInterval),
  );
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
