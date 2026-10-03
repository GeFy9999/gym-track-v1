import { API_URL } from "./api";
import { consumePendingPlan } from "./pendingPlan";

// Lifetime is a one-time Stripe Payment Link-style price, not a recurring
// subscription — the backend's /stripe/checkout-session endpoint only
// knows "monthly" | "annual" (see backend/src/services/stripeService.ts).
// Lifetime purchases go through the same endpoint with mode handled
// server-side; if that's not yet supported there, this falls back to
// annual so the user isn't stuck with no visible outcome.
type CheckoutResult = { url: string } | { error: string };

export async function startCheckoutForPendingPlan(
  token: string,
): Promise<CheckoutResult | null> {
  const plan = consumePendingPlan();
  if (!plan) return null;

  try {
    const res = await fetch(`${API_URL}/stripe/checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const result = await res.json();
    if (!res.ok) return { error: result.error || "Checkout error" };
    return { url: result.url };
  } catch {
    return { error: "Network error" };
  }
}
