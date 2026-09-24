// Loyalty discount: every consecutive renewal a subscriber pays chips 10
// cents off the next one, capped at $1 total. Cancelling resets the count,
// so a resubscription always starts back at the base price.
export const LOYALTY_CENTS_PER_PERIOD = 10;
export const LOYALTY_MAX_CENTS = 100;

export function computeLoyaltyDiscountCents(periodsPaid: number): number {
  return Math.min(periodsPaid * LOYALTY_CENTS_PER_PERIOD, LOYALTY_MAX_CENTS);
}

export function loyaltyCouponId(cents: number): string {
  return `loyalty_${cents}_cad`;
}
