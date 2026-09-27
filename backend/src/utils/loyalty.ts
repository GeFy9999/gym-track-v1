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
