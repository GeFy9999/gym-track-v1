import Stripe from "stripe";
import { prisma } from "../prisma.js";
import {
  getUserById,
  getUserByStripeCustomerId,
} from "../repositories/databaseRepository.js";

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

  // Lifetime is a one-time payment (no subscription, no trial) — everything
  // else is a recurring subscription with a 7-day free trial.
  const session =
    plan === "lifetime"
      ? await client.checkout.sessions.create({
          mode: "payment",
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${process.env.FRONTEND_URL}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
        })
      : await client.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          subscription_data: { trial_period_days: 7 },
          success_url: `${process.env.FRONTEND_URL}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/upgrade`,
        });

  if (!session.url) throw new Error("Impossible de créer la session de paiement");
  return session.url;
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

      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: true, stripeSubscriptionId: subscriptionId },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: ["active", "trialing"].includes(subscription.status),
          stripeSubscriptionId: subscription.id,
          proCurrentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000)
            : null,
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

      await prisma.user.update({
        where: { id: user.id },
        data: { isPro: false, proCurrentPeriodEnd: null },
      });
      break;
    }
  }
};
