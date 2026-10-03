// The plan chosen in PlanSelector is remembered across the register →
// verify-email-pending → verify-email hop (all same-origin here, but still
// separate page loads) so the post-verification step knows which plan to
// send to Stripe Checkout.
const STORAGE_KEY = "pendingPlan";
const VALID_PLANS = ["monthly", "annual", "lifetime"] as const;
export type PendingPlan = (typeof VALID_PLANS)[number];

export function isValidPlan(value: string | null): value is PendingPlan {
  return !!value && (VALID_PLANS as readonly string[]).includes(value);
}

export function capturePendingPlan(value: string | null): void {
  if (isValidPlan(value)) {
    localStorage.setItem(STORAGE_KEY, value);
  }
}

export function peekPendingPlan(): PendingPlan | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return isValidPlan(value) ? value : null;
}

export function consumePendingPlan(): PendingPlan | null {
  const plan = peekPendingPlan();
  if (plan) localStorage.removeItem(STORAGE_KEY);
  return plan;
}
