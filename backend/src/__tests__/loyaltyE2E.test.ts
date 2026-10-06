import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { registerUser } from "./helpers.js";

// End-to-end through the real HTTP routes: RevenueCat webhooks in, then what
// the app actually receives from /api/auth/me (discount shown on the
// Profile card, tier the "Activer ma réduction" button switches to). Uses
// the real Play Console product ids.

const SECRET = "rc_e2e_secret";
const MONTHLY = "gymstrack_pro_monthly:monthly-autorenew";
const YEARLY = "gymstrack_pro_yearly:gymstrack-pro-yearly";

beforeAll(() => {
  process.env.REVENUECAT_WEBHOOK_SECRET = SECRET;
});

const webhook = (
  userId: string,
  type: string,
  productId: string,
  extra: Record<string, unknown> = {},
  auth = SECRET,
) =>
  request(app)
    .post("/api/revenuecat/webhook")
    .set("Authorization", auth)
    .send({
      event: {
        id: randomUUID(),
        type,
        app_user_id: userId,
        product_id: productId,
        environment: "SANDBOX",
        expiration_at_ms: Date.now() + 30 * 60_000,
        ...extra,
      },
    });

const me = async (token: string) =>
  (await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`)).body
    .user as {
    isPro: boolean;
    proInterval: string | null;
    proProductId: string | null;
    loyaltyPeriodsPaid: number;
    loyaltyDiscountCents: number;
    loyaltyActiveDiscountCents: number;
    loyaltyUpgradeProductId: string | null;
  };

const renew = async (userId: string, productId: string, times: number) => {
  for (let i = 0; i < times; i++) {
    expect((await webhook(userId, "RENEWAL", productId)).status).toBe(200);
  }
};

describe("Google Play loyalty, end to end (webhook → /auth/me)", () => {
  it("walks a subscriber through monthly tiers, the cap, a switch to yearly and expiration", async () => {
    const { token, user } = await registerUser();

    // Purchase: Pro, no discount yet, nothing to activate.
    expect((await webhook(user.id, "INITIAL_PURCHASE", MONTHLY)).status).toBe(200);
    let u = await me(token);
    expect(u).toMatchObject({
      isPro: true,
      proInterval: "month",
      proProductId: MONTHLY,
      loyaltyDiscountCents: 0,
      loyaltyUpgradeProductId: null,
    });

    // 3 paid renewals → -0.30$, tier 3 (4.69$) offered.
    await renew(user.id, MONTHLY, 3);
    u = await me(token);
    expect(u.loyaltyDiscountCents).toBe(30);
    // Earned, but still paying full price until they activate the tier.
    expect(u.loyaltyActiveDiscountCents).toBe(0);
    expect(u.loyaltyUpgradeProductId).toBe("gymstrack_pro_monthly:monthly-l3");

    // The same renewal delivered twice still counts once.
    const id = randomUUID();
    await webhook(user.id, "RENEWAL", MONTHLY, { id });
    await webhook(user.id, "RENEWAL", MONTHLY, { id });
    u = await me(token);
    expect(u.loyaltyPeriodsPaid).toBe(4);
    expect(u.loyaltyUpgradeProductId).toBe("gymstrack_pro_monthly:monthly-l4");

    // Subscriber activates it: Play switches them to the tier.
    await webhook(user.id, "PRODUCT_CHANGE", MONTHLY, {
      new_product_id: "gymstrack_pro_monthly:monthly-l4",
    });
    u = await me(token);
    expect(u).toMatchObject({
      isPro: true,
      proInterval: "month",
      proProductId: "gymstrack_pro_monthly:monthly-l4",
      loyaltyDiscountCents: 40,
      loyaltyActiveDiscountCents: 40, // now actually paying 4.59$
      loyaltyUpgradeProductId: null, // nothing more to activate yet
    });

    // Renewing on a tier keeps counting; past 10 it's capped at -1.00$.
    await renew(user.id, "gymstrack_pro_monthly:monthly-l4", 9);
    u = await me(token);
    expect(u.loyaltyPeriodsPaid).toBe(13);
    expect(u.loyaltyDiscountCents).toBe(100);
    expect(u.loyaltyUpgradeProductId).toBe("gymstrack_pro_monthly:monthly-l10");
    await webhook(user.id, "PRODUCT_CHANGE", "gymstrack_pro_monthly:monthly-l4", {
      new_product_id: "gymstrack_pro_monthly:monthly-l10",
    });
    await renew(user.id, "gymstrack_pro_monthly:monthly-l10", 2);
    u = await me(token);
    expect(u.loyaltyDiscountCents).toBe(100);
    expect(u.loyaltyUpgradeProductId).toBeNull(); // already on the cheapest tier

    // Switching to yearly restarts the streak.
    await webhook(user.id, "PRODUCT_CHANGE", "gymstrack_pro_monthly:monthly-l10", {
      new_product_id: YEARLY,
    });
    u = await me(token);
    expect(u).toMatchObject({
      isPro: true,
      proInterval: "year",
      proProductId: YEARLY,
      loyaltyPeriodsPaid: 0,
      loyaltyDiscountCents: 0,
      loyaltyUpgradeProductId: null,
    });

    // Yearly: -1$ per renewal, capped at tier 3 (26.99$).
    await renew(user.id, YEARLY, 2);
    expect((await me(token)).loyaltyUpgradeProductId).toBe("gymstrack_pro_yearly:yearly-l2");
    await renew(user.id, YEARLY, 3);
    u = await me(token);
    expect(u.loyaltyDiscountCents).toBe(300);
    expect(u.loyaltyUpgradeProductId).toBe("gymstrack_pro_yearly:yearly-l3");

    // Expiration: Pro off, streak reset, nothing offered.
    await webhook(user.id, "EXPIRATION", YEARLY);
    u = await me(token);
    expect(u).toMatchObject({
      isPro: false,
      loyaltyPeriodsPaid: 0,
      loyaltyDiscountCents: 0,
      loyaltyUpgradeProductId: null,
    });
  });

  it("rejects webhooks without the RevenueCat secret and changes nothing", async () => {
    const { token, user } = await registerUser();
    const res = await webhook(user.id, "INITIAL_PURCHASE", MONTHLY, {}, "wrong");
    expect(res.status).toBe(400);
    expect((await me(token)).isPro).toBe(false);
  });

  it("ignores events for an unknown user", async () => {
    const res = await webhook(randomUUID(), "RENEWAL", MONTHLY);
    expect(res.status).toBe(200);
  });

  it("never offers a Google Play tier to a Stripe subscriber", async () => {
    const { token, user } = await registerUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: true, proInterval: "month", loyaltyPeriodsPaid: 5 },
    });
    const u = await me(token);
    expect(u.loyaltyDiscountCents).toBe(50);
    expect(u.loyaltyActiveDiscountCents).toBe(50); // Stripe applies it itself
    expect(u.loyaltyUpgradeProductId).toBeNull();
  });
});
