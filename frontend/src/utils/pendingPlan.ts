// Carries a plan chosen on the marketing site (gymstrack.app) through
// account creation + email verification — none of which can go straight to
// Stripe Checkout, since that requires an authenticated account that
// doesn't exist yet. localStorage survives across those page loads where a
// query param wouldn't without manually threading it through every step.
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
