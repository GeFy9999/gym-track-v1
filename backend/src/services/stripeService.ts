import Stripe from "stripe";
import { prisma } from "../prisma.js";
import {
  getUserById,
  getUserByStripeCustomerId,
} from "../repositories/databaseRepository.js";
import {
  computeLoyaltyDiscountCents,
  loyaltyCouponId,
} from "../utils/loyalty.js";

// Permanent failures (the subscription is already gone) never succeed no
// matter how many times we retry — only worth retrying transient conflicts
// like Stripe briefly locking a subscription around its own renewal.
function isPermanentSubscriptionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("No such subscription") ||
    message.includes("can only update its cancellation_details")
  );
}

async function retry<T>(fn: () => Promise<T>, attempts = 5, delayMs = 4000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isPermanentSubscriptionError(err)) break;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe n'est pas configuré (STRIPE_SECRET_KEY manquant)");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

type Plan = "monthly" | "annual" | "lifetime";

const PRICE_BY_PLAN: Record<Plan, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

export const createCheckoutSession = async (userId: string, plan: Plan) => {
  const priceId = PRICE_BY_PLAN[plan];
  if (!priceId) throw new Error("Plan invalide");

  const user = await getUserById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  const client = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await client.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Managed Payments (Stripe's automatic tax handling) is on by default for
  // new accounts and requires a tax_code on every product — we don't want
  // that complexity yet, so opt every session out of it explicitly.
  //
  // Lifetime is a one-time payment (no subscription, no trial) — everything
  // else is a recurring subscription with a 7-day free trial.
  const session =
    plan === "lifetime"
      ? await client.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          managed_payments: { enabled: false },
          success_url: `${process.env.FRONTEND_URL}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
        })
      : await client.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          subscription_data: { trial_period_days: 7 },
          managed_payments: { enabled: false },
          success_url: `${process.env.FRONTEND_URL}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
        });

  if (!session.url) throw new Error("Impossible de créer la session de paiement");
  return session.url;
};

export const changePlan = async (
  userId: string,
  newPlan: Plan,
): Promise<{ switched: true } | { url: string }> => {
  const priceId = PRICE_BY_PLAN[newPlan];
  if (!priceId) throw new Error("Plan invalide");

  const user = await getUserById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  // Switching between the two recurring plans updates the existing
  // subscription in place (prorated) — no new checkout, no new trial, and
  // no duplicate active subscription on the same customer.
  if (newPlan !== "lifetime" && user.stripeSubscriptionId) {
    const client = getStripe();
    const subscription = await client.subscriptions.retrieve(user.stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) throw new Error("Abonnement introuvable");

    await client.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });
    return { switched: true };
  }

  // Anything else (switching to lifetime, or no existing subscription to
  // modify) goes through a normal checkout — the webhook cancels any prior
  // subscription once the new payment actually completes.
  const url = await createCheckoutSession(userId, newPlan);
  return { url };
};

// Loyalty discount coupons are shared, fixed-amount objects reused across
// every subscriber at that tier (not created per-user) — retrieve the one
// for this amount, creating it once on first use if it doesn't exist yet.
const getOrCreateLoyaltyCoupon = async (
  client: Stripe,
  cents: number,
): Promise<string> => {
  const id = loyaltyCouponId(cents);
  try {
    await client.coupons.retrieve(id);
  } catch {
    await client.coupons.create({
      id,
      amount_off: cents,
      currency: "cad",
      duration: "forever",
      name: `Fidélité -${(cents / 100).toFixed(2)}$`,
    });
  }
  return id;
};

export const createPortalSession = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) throw new Error("Utilisateur introuvable");
  if (!user.stripeCustomerId) {
    throw new Error("Aucun abonnement Stripe associé à ce compte");
  }

  const client = getStripe();
  const session = await client.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/profil`,
  });

  return session.url;
};

export const handleWebhookEvent = async (rawBody: Buffer, signature: string) => {
  const client = getStripe();
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe n'est pas configuré (STRIPE_WEBHOOK_SECRET manquant)");
  }

  const event = client.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!customerId) break;

      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      // A one-time (lifetime) purchase replaces any recurring subscription
      // the customer already had — cancel it so they aren't billed twice.
      if (session.mode === "payment" && user.stripeSubscriptionId) {
        await client.subscriptions.cancel(user.stripeSubscriptionId).catch(() => {});
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: true,
          stripeSubscriptionId: subscriptionId,
          ...(session.mode === "payment"
            ? { proCurrentPeriodEnd: null, proInterval: null, loyaltyPeriodsPaid: 0 }
            : {}),
        },
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
      const interval = subscription.items.data[0]?.price.recurring?.interval ?? null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: ["active", "trialing"].includes(subscription.status),
          stripeSubscriptionId: subscription.id,
          proCurrentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
          proInterval: interval,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      // If the user has already moved on (e.g. switched to lifetime, which
      // cancels the old subscription as a side effect), this deletion event
      // is stale — don't let it clobber their now-correct state.
      if (user.stripeSubscriptionId !== subscription.id) break;

      // Cancelling resets the loyalty streak — a future resubscription
      // starts back at the base price, not wherever the discount left off.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proCurrentPeriodEnd: null,
          proInterval: null,
          loyaltyPeriodsPaid: 0,
        },
      });
      break;
    }

    // Fires once per successful renewal (not the initial subscription
    // invoice) — each one chips another 10¢ off the price, up to $1 total.
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason !== "subscription_cycle") break;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const subscriptionDetails = invoice.parent?.subscription_details;
      const subscriptionId =
        typeof subscriptionDetails?.subscription === "string"
          ? subscriptionDetails.subscription
          : subscriptionDetails?.subscription?.id;
      if (!subscriptionId) break;

      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      const periodsPaid = user.loyaltyPeriodsPaid + 1;
      const discountCents = computeLoyaltyDiscountCents(periodsPaid);

      await prisma.user.update({
        where: { id: user.id },
        data: { loyaltyPeriodsPaid: periodsPaid },
      });

      if (discountCents > 0) {
        const couponId = await getOrCreateLoyaltyCoupon(client, discountCents);
        // Stripe briefly locks a subscription against updates right around
        // the moment its renewal invoice is issued (most visible with test
        // clocks, but Stripe's own docs note it can happen for real
        // subscriptions too) — a couple of short retries rides that out
        // instead of silently losing the discount for this cycle.
        await retry(() =>
          client.subscriptions.update(subscriptionId, {
            discounts: [{ coupon: couponId }],
          }),
        );
      }
      break;
    }
  }
};
