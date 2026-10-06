import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../prisma.js";
import { handleRevenueCatWebhook } from "../services/revenueCatService.js";
import {
  googlePlayLoyaltyUpgradeProductId,
  googlePlayTierProductId,
} from "../utils/loyalty.js";

// Simulates months/years of RevenueCat (Google Play) webhooks to check the
// loyalty price tiers without waiting for real renewals.

const SECRET = "rc_test_secret";
// Same shape as the real Play Console products.
const MONTHLY = "gymstrack_pro_monthly:monthly-autorenew";
const YEARLY = "gymstrack_pro_yearly:gymstrack-pro-yearly";

beforeAll(() => {
  process.env.REVENUECAT_WEBHOOK_SECRET = SECRET;
});

async function newUser() {
  return prisma.user.create({
    data: {
      email: `rc_${randomUUID()}@example.com`,
      name: "RC Test",
      password: "not-used",
    },
  });
}

const send = (
  userId: string,
  type: string,
  productId: string,
  extra: { id?: string; new_product_id?: string; environment?: string } = {},
) =>
  handleRevenueCatWebhook(SECRET, {
    event: {
      id: extra.id ?? randomUUID(),
      type,
      app_user_id: userId,
      product_id: productId,
      expiration_at_ms: Date.now() + 30 * 86400_000,
      ...(extra.new_product_id ? { new_product_id: extra.new_product_id } : {}),
      ...(extra.environment ? { environment: extra.environment } : {}),
    },
  });

const load = (id: string) => prisma.user.findUniqueOrThrow({ where: { id } });
const upgradeFor = async (id: string) =>
  googlePlayLoyaltyUpgradeProductId(await load(id));

describe("Google Play loyalty tiers", () => {
  it("monthly: each paid renewal earns the next cheaper tier, up to -l10", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", MONTHLY);
    expect((await load(u.id)).loyaltyPeriodsPaid).toBe(0);
    expect(await upgradeFor(u.id)).toBeNull();

    for (let i = 0; i < 3; i++) await send(u.id, "RENEWAL", MONTHLY);
    expect((await load(u.id)).loyaltyPeriodsPaid).toBe(3);
    expect(await upgradeFor(u.id)).toBe("gymstrack_pro_monthly:monthly-l3");

    for (let i = 0; i < 9; i++) await send(u.id, "RENEWAL", MONTHLY);
    expect(await upgradeFor(u.id)).toBe("gymstrack_pro_monthly:monthly-l10");
  });

  it("moving to the earned tier keeps the streak and stops offering it", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", MONTHLY);
    for (let i = 0; i < 3; i++) await send(u.id, "RENEWAL", MONTHLY);

    await send(u.id, "PRODUCT_CHANGE", MONTHLY, {
      new_product_id: "gymstrack_pro_monthly:monthly-l3",
    });
    const after = await load(u.id);
    expect(after.loyaltyPeriodsPaid).toBe(3);
    expect(after.proProductId).toBe("gymstrack_pro_monthly:monthly-l3");
    expect(await upgradeFor(u.id)).toBeNull();

    // Renewing on the tier keeps counting and offers the next one.
    await send(u.id, "RENEWAL", "gymstrack_pro_monthly:monthly-l3");
    expect(await upgradeFor(u.id)).toBe("gymstrack_pro_monthly:monthly-l4");
  });

  it("yearly: up to -l3", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", YEARLY);
    for (let i = 0; i < 4; i++) await send(u.id, "RENEWAL", YEARLY);
    expect(await upgradeFor(u.id)).toBe("gymstrack_pro_yearly:yearly-l3");
  });

  it("counts a redelivered renewal only once", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", MONTHLY);
    await send(u.id, "RENEWAL", MONTHLY, { id: "evt_1" });
    await send(u.id, "RENEWAL", MONTHLY, { id: "evt_1" });
    expect((await load(u.id)).loyaltyPeriodsPaid).toBe(1);
  });

  it("counts test (sandbox) renewals too, so testers can try the tiers quickly", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", YEARLY, { environment: "SANDBOX" });
    for (let i = 0; i < 2; i++) {
      await send(u.id, "RENEWAL", YEARLY, { environment: "SANDBOX" });
    }
    expect((await load(u.id)).loyaltyPeriodsPaid).toBe(2);
    expect(await upgradeFor(u.id)).toBe("gymstrack_pro_yearly:yearly-l2");
  });

  it("switching monthly -> yearly restarts the streak at 0", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", MONTHLY);
    for (let i = 0; i < 5; i++) await send(u.id, "RENEWAL", MONTHLY);

    await send(u.id, "PRODUCT_CHANGE", MONTHLY, { new_product_id: YEARLY });
    const after = await load(u.id);
    expect(after.loyaltyPeriodsPaid).toBe(0);
    expect(after.proInterval).toBe("year");
    expect(await upgradeFor(u.id)).toBeNull();
  });

  it("expiration resets the streak", async () => {
    const u = await newUser();
    await send(u.id, "INITIAL_PURCHASE", MONTHLY);
    for (let i = 0; i < 2; i++) await send(u.id, "RENEWAL", MONTHLY);
    await send(u.id, "EXPIRATION", MONTHLY);

    const after = await load(u.id);
    expect(after.loyaltyPeriodsPaid).toBe(0);
    expect(after.isPro).toBe(false);
  });

  it("never offers a tier to Stripe subscribers", async () => {
    const u = await newUser();
    await prisma.user.update({
      where: { id: u.id },
      data: { loyaltyPeriodsPaid: 5, proInterval: "month" },
    });
    expect(await upgradeFor(u.id)).toBeNull();
  });

  it("builds tier ids only for '<subscription>:<basePlan>' product ids", () => {
    expect(googlePlayTierProductId("pro_monthly:monthly-autorenew", 1)).toBe("pro_monthly:monthly-l1");
    expect(googlePlayTierProductId("pro_yearly:gymstrack-pro-yearly", 2)).toBe("pro_yearly:yearly-l2");
    expect(googlePlayTierProductId("pro_yearly:yearly-l1", 3)).toBe("pro_yearly:yearly-l3");
    expect(googlePlayTierProductId("pro_monthly:monthly-l2", 5)).toBe("pro_monthly:monthly-l5");
    expect(googlePlayTierProductId("pro_monthly:monthly-l2", 0)).toBeNull();
    expect(googlePlayTierProductId("legacy_monthly", 3)).toBeNull();
  });
});
