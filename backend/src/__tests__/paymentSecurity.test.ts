import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../prisma.js";

// Stripe is mocked: the "signature check" just parses the body (the real
// check is Stripe's own constructEvent), so these tests are about what each
// event is allowed to do once it's been authenticated.
vi.mock("stripe", () => ({
  default: class {
    webhooks = {
      constructEvent: (body: Buffer) => JSON.parse(body.toString()),
    };
    subscriptions = { cancel: async () => ({}) };
  },
}));

const { handleWebhookEvent } = await import("../services/stripeService.js");
const { handleRevenueCatWebhook } = await import("../services/revenueCatService.js");
const { unsubscribeToken } = await import("../services/loyaltyReminders.js");

const RC_SECRET = "rc_test_secret_value";

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
  process.env.REVENUECAT_WEBHOOK_SECRET = RC_SECRET;
});

async function stripeCustomer() {
  const customerId = `cus_${randomUUID()}`;
  const user = await prisma.user.create({
    data: {
      email: `pay_${randomUUID()}@example.com`,
      name: "Payment Test",
      password: "not-used",
      stripeCustomerId: customerId,
    },
  });
  return { user, customerId };
}

const checkoutEvent = (
  type: string,
  customerId: string,
  payment_status: "paid" | "unpaid" | "no_payment_required",
) =>
  handleWebhookEvent(
    Buffer.from(
      JSON.stringify({
        type,
        data: {
          object: { customer: customerId, mode: "payment", subscription: null, payment_status },
        },
      }),
    ),
    "sig",
  );

const isPro = async (id: string) =>
  (await prisma.user.findUniqueOrThrow({ where: { id } })).isPro;

describe("Stripe checkout only grants Pro once it's paid", () => {
  it("grants Pro for a checkout paid by card", async () => {
    const { user, customerId } = await stripeCustomer();
    await checkoutEvent("checkout.session.completed", customerId, "paid");
    expect(await isPro(user.id)).toBe(true);
  });

  it("does not grant Pro while a delayed payment is still pending", async () => {
    const { user, customerId } = await stripeCustomer();
    await checkoutEvent("checkout.session.completed", customerId, "unpaid");
    expect(await isPro(user.id)).toBe(false);
  });

  it("grants Pro once the delayed payment succeeds", async () => {
    const { user, customerId } = await stripeCustomer();
    await checkoutEvent("checkout.session.completed", customerId, "unpaid");
    await checkoutEvent("checkout.session.async_payment_succeeded", customerId, "paid");
    expect(await isPro(user.id)).toBe(true);
  });

  it("never grants Pro when the delayed payment fails", async () => {
    const { user, customerId } = await stripeCustomer();
    await checkoutEvent("checkout.session.completed", customerId, "unpaid");
    await checkoutEvent("checkout.session.async_payment_failed", customerId, "unpaid");
    expect(await isPro(user.id)).toBe(false);
  });

  it("grants Pro for a subscription starting on its free trial", async () => {
    const { user, customerId } = await stripeCustomer();
    await checkoutEvent("checkout.session.completed", customerId, "no_payment_required");
    expect(await isPro(user.id)).toBe(true);
  });
});

describe("RevenueCat webhook secret", () => {
  const event = { event: { type: "TEST", app_user_id: randomUUID() } };

  it("accepts the exact secret", async () => {
    await expect(handleRevenueCatWebhook(RC_SECRET, event)).resolves.toBeUndefined();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["wrong, same length", RC_SECRET.replace(/.$/, "X")],
    ["a prefix of it", RC_SECRET.slice(0, 5)],
    ["longer", `${RC_SECRET}x`],
  ])("rejects a %s secret", async (_label, header) => {
    await expect(handleRevenueCatWebhook(header, event)).rejects.toThrow(
      "Authentification webhook invalide",
    );
  });
});

describe("unsubscribe link signature", () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it("refuses to sign with an empty key", () => {
    delete process.env.JWT_SECRET;
    expect(() => unsubscribeToken("user-1")).toThrow("JWT_SECRET manquant");
  });

  it("signs differently with a different secret", () => {
    process.env.JWT_SECRET = "secret-a";
    const a = unsubscribeToken("user-1");
    process.env.JWT_SECRET = "secret-b";
    expect(unsubscribeToken("user-1")).not.toBe(a);
  });
});
