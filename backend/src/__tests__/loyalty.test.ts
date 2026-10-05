import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../prisma.js";

// Simulates months/years of Stripe webhooks so the loyalty discount can be
// checked without waiting for real renewals. Stripe itself is mocked: the
// "signature check" just parses the body, and coupon/subscription calls are
// recorded instead of hitting the API.
const stripeMock = vi.hoisted(() => {
  // Read by stripeService at import time.
  process.env.STRIPE_PRICE_MONTHLY = "price_monthly";
  process.env.STRIPE_PRICE_ANNUAL = "price_annual";
  return {
    coupons: new Set<string>(),
    // coupon: the applied coupon id, "" when discounts were cleared.
    subscriptionUpdates: [] as { id: string; coupon?: string | undefined; price?: string | undefined }[],
    checkoutSessions: [] as { subscription_data?: { trial_period_days?: number } }[],
    failNextSubscriptionUpdate: false,
  };
});

vi.mock("stripe", () => ({
  default: class {
    webhooks = {
      constructEvent: (body: Buffer) => JSON.parse(body.toString()),
    };
    coupons = {
      retrieve: async (id: string) => {
        if (!stripeMock.coupons.has(id)) throw new Error("No such coupon");
        return { id };
      },
      create: async ({ id }: { id: string }) => {
        stripeMock.coupons.add(id);
        return { id };
      },
    };
    subscriptions = {
      retrieve: async (id: string) => ({
        id,
        items: { data: [{ id: "si_mock" }] },
      }),
      update: async (
        id: string,
        params: {
          discounts?: { coupon: string }[] | "";
          items?: { price: string }[];
        },
      ) => {
        if (stripeMock.failNextSubscriptionUpdate) {
          stripeMock.failNextSubscriptionUpdate = false;
          // A "permanent" error so the service's retry loop gives up at once
          // instead of waiting between attempts.
          throw new Error("No such subscription");
        }
        stripeMock.subscriptionUpdates.push({
          id,
          coupon:
            params.discounts === ""
              ? ""
              : params.discounts?.[0]?.coupon,
          price: params.items?.[0]?.price,
        });
        return { id };
      },
      cancel: async () => ({}),
    };
    customers = {
      create: async () => ({ id: `cus_${Math.random()}` }),
    };
    checkout = {
      sessions: {
        create: async (params: {
          subscription_data?: { trial_period_days?: number };
        }) => {
          stripeMock.checkoutSessions.push(params);
          return { url: "https://checkout.stripe.test/session" };
        },
      },
    };
  },
}));

const { handleWebhookEvent, changePlan, createCheckoutSession } = await import(
  "../services/stripeService.js"
);

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
});

beforeEach(() => {
  stripeMock.subscriptionUpdates.length = 0;
  stripeMock.checkoutSessions.length = 0;
  stripeMock.failNextSubscriptionUpdate = false;
});

// Created straight in the database: going through /api/auth/register would
// trip its rate limit with this many accounts in one file.
async function registerUser() {
  const user = await prisma.user.create({
    data: {
      email: `loyalty_${randomUUID()}@example.com`,
      name: "Loyalty Test",
      password: "not-used",
    },
  });
  return { user };
}

const send = (event: object) =>
  handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig");

async function subscriber(interval: "month" | "year") {
  const { user } = await registerUser();
  const customerId = `cus_${randomUUID()}`;
  const subscriptionId = `sub_${randomUUID()}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customerId },
  });

  // Checkout with the 7-day trial: subscription created + a $0 first invoice.
  await send({
    type: "customer.subscription.created",
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        status: "trialing",
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.now() / 1000) + 7 * 86400,
              price: { recurring: { interval } },
            },
          ],
        },
      },
    },
  });
  await send(invoice(customerId, subscriptionId, "subscription_create"));

  return { userId: user.id as string, customerId, subscriptionId };
}

function invoice(
  customerId: string,
  subscriptionId: string,
  billingReason: string,
  id = `in_${randomUUID()}`,
) {
  return {
    type: "invoice.paid",
    data: {
      object: {
        id,
        billing_reason: billingReason,
        customer: customerId,
        parent: { subscription_details: { subscription: subscriptionId } },
      },
    },
  };
}

const periodsPaid = async (userId: string) =>
  (await prisma.user.findUniqueOrThrow({ where: { id: userId } }))
    .loyaltyPeriodsPaid;

const appliedCoupons = () =>
  stripeMock.subscriptionUpdates.map((u) => u.coupon);

describe("loyalty discount", () => {
  it("monthly: -10¢ more after each paid month, capped at -$1", async () => {
    const s = await subscriber("month");
    expect(await periodsPaid(s.userId)).toBe(0); // the $0 trial invoice doesn't count

    for (let i = 0; i < 12; i++) {
      await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    }

    expect(await periodsPaid(s.userId)).toBe(12);
    expect(appliedCoupons()).toEqual([
      "loyalty_10_cad_m",
      "loyalty_20_cad_m",
      "loyalty_30_cad_m",
      "loyalty_40_cad_m",
      "loyalty_50_cad_m",
      "loyalty_60_cad_m",
      "loyalty_70_cad_m",
      "loyalty_80_cad_m",
      "loyalty_90_cad_m",
      "loyalty_100_cad_m",
      "loyalty_100_cad_m",
      "loyalty_100_cad_m",
    ]);
    expect(
      stripeMock.subscriptionUpdates.every((u) => u.id === s.subscriptionId),
    ).toBe(true);
  });

  it("yearly: -$1 more after each paid year, capped at -$3", async () => {
    const s = await subscriber("year");

    for (let i = 0; i < 4; i++) {
      await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    }

    expect(appliedCoupons()).toEqual([
      "loyalty_100_cad_y",
      "loyalty_200_cad_y",
      "loyalty_300_cad_y",
      "loyalty_300_cad_y",
    ]);
  });

  it("ignores proration and other non-renewal invoices", async () => {
    const s = await subscriber("month");
    await send(invoice(s.customerId, s.subscriptionId, "subscription_update"));
    await send(invoice(s.customerId, s.subscriptionId, "manual"));

    expect(await periodsPaid(s.userId)).toBe(0);
    expect(appliedCoupons()).toEqual([]);
  });

  it("counts a renewal once even if Stripe delivers the webhook twice", async () => {
    const s = await subscriber("month");
    const renewal = invoice(s.customerId, s.subscriptionId, "subscription_cycle");

    await send(renewal);
    await send(renewal);

    expect(await periodsPaid(s.userId)).toBe(1);
    expect(appliedCoupons()).toEqual(["loyalty_10_cad_m", "loyalty_10_cad_m"]);
  });

  it("still applies the coupon, without double counting, when Stripe retries after a failure", async () => {
    const s = await subscriber("month");
    const renewal = invoice(s.customerId, s.subscriptionId, "subscription_cycle");

    stripeMock.failNextSubscriptionUpdate = true;
    await expect(send(renewal)).rejects.toThrow();
    // Stripe redelivers the same event after our error response.
    await send(renewal);

    expect(await periodsPaid(s.userId)).toBe(1);
    expect(appliedCoupons()).toEqual(["loyalty_10_cad_m"]);
  });

  it("cancelling resets the streak; a new subscription starts from scratch", async () => {
    const s = await subscriber("month");
    for (let i = 0; i < 3; i++) {
      await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    }
    expect(await periodsPaid(s.userId)).toBe(3);

    await send({
      type: "customer.subscription.deleted",
      data: { object: { id: s.subscriptionId, customer: s.customerId } },
    });
    expect(await periodsPaid(s.userId)).toBe(0);

    const newSubscriptionId = `sub_${randomUUID()}`;
    await send({
      type: "customer.subscription.created",
      data: {
        object: {
          id: newSubscriptionId,
          customer: s.customerId,
          status: "active",
          items: {
            data: [{ current_period_end: 0, price: { recurring: { interval: "month" } } }],
          },
        },
      },
    });
    stripeMock.subscriptionUpdates.length = 0;
    await send(invoice(s.customerId, newSubscriptionId, "subscription_cycle"));

    expect(await periodsPaid(s.userId)).toBe(1);
    expect(appliedCoupons()).toEqual(["loyalty_10_cad_m"]);
  });

  it("ignores renewals of a subscription the user has since replaced", async () => {
    const s = await subscriber("month");
    await send(invoice(s.customerId, `sub_${randomUUID()}`, "subscription_cycle"));

    expect(await periodsPaid(s.userId)).toBe(0);
    expect(appliedCoupons()).toEqual([]);
  });
});

function subscriptionEvent(
  type: "customer.subscription.created" | "customer.subscription.updated",
  s: { customerId: string; subscriptionId: string },
  interval: "month" | "year",
  discounts: string[] = [],
) {
  return {
    type,
    data: {
      object: {
        id: s.subscriptionId,
        customer: s.customerId,
        status: "active",
        discounts,
        items: {
          data: [{ current_period_end: 0, price: { recurring: { interval } } }],
        },
      },
    },
  };
}

describe("changing plan", () => {
  it("from the app: restarts the streak at 0 and removes the loyalty coupon", async () => {
    const s = await subscriber("month");
    for (let i = 0; i < 5; i++) {
      await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    }
    await prisma.user.update({
      where: { id: s.userId },
      data: { stripeSubscriptionId: s.subscriptionId },
    });
    stripeMock.subscriptionUpdates.length = 0;

    await changePlan(s.userId, "annual");

    expect(stripeMock.subscriptionUpdates).toEqual([
      { id: s.subscriptionId, coupon: "", price: "price_annual" },
    ]);
    expect(await periodsPaid(s.userId)).toBe(0);

    // The next annual renewal starts the annual streak from scratch.
    await send(subscriptionEvent("customer.subscription.updated", s, "year"));
    stripeMock.subscriptionUpdates.length = 0;
    await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    expect(appliedCoupons()).toEqual(["loyalty_100_cad_y"]);
  });

  it("from Stripe's portal (annual → monthly): the webhook resets it too", async () => {
    const s = await subscriber("year");
    for (let i = 0; i < 2; i++) {
      await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    }
    stripeMock.subscriptionUpdates.length = 0;

    await send(
      subscriptionEvent("customer.subscription.updated", s, "month", [
        "di_loyalty",
      ]),
    );

    expect(await periodsPaid(s.userId)).toBe(0);
    expect(appliedCoupons()).toEqual([""]);
  });

  it("a normal update on the same plan keeps the streak", async () => {
    const s = await subscriber("month");
    await send(invoice(s.customerId, s.subscriptionId, "subscription_cycle"));
    stripeMock.subscriptionUpdates.length = 0;

    await send(
      subscriptionEvent("customer.subscription.updated", s, "month", [
        "di_loyalty",
      ]),
    );

    expect(await periodsPaid(s.userId)).toBe(1);
    expect(appliedCoupons()).toEqual([]);
  });
});

describe("free trial", () => {
  it("is offered once per account, across monthly and annual", async () => {
    const { user } = await registerUser();

    await createCheckoutSession(user.id, "monthly");
    expect(stripeMock.checkoutSessions[0]?.subscription_data).toEqual({
      trial_period_days: 7,
    });

    // The monthly subscription gets created (with its trial)...
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    await send(
      subscriptionEvent(
        "customer.subscription.created",
        { customerId: fresh.stripeCustomerId!, subscriptionId: `sub_${randomUUID()}` },
        "month",
      ),
    );

    // ...so no further checkout gets one, whichever plan.
    await createCheckoutSession(user.id, "annual");
    await createCheckoutSession(user.id, "monthly");
    expect(stripeMock.checkoutSessions[1]?.subscription_data).toBeUndefined();
    expect(stripeMock.checkoutSessions[2]?.subscription_data).toBeUndefined();
  });

  it("an abandoned checkout doesn't use up the trial", async () => {
    const { user } = await registerUser();
    await createCheckoutSession(user.id, "annual");
    await createCheckoutSession(user.id, "annual");

    expect(stripeMock.checkoutSessions[1]?.subscription_data).toEqual({
      trial_period_days: 7,
    });
  });
});
