import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../prisma.js";
import {
  sendDueLoyaltyReminders,
  type ReminderEmail,
} from "../services/loyaltyReminders.js";

const DAY = 24 * 60 * 60 * 1000;
const MONTHLY = "gymstrack_pro_monthly:monthly-autorenew";

let outbox: ReminderEmail[];
const send = async (email: ReminderEmail) => {
  outbox.push(email);
};

beforeEach(async () => {
  outbox = [];
  // Other test files leave Google Play subscribers behind; keep this file's
  // runs about its own users only.
  await prisma.user.updateMany({
    where: { billingProvider: "google_play" },
    data: { isPro: false },
  });
});

// A Google Play subscriber whose last renewal was at `renewedAt`, with the
// next one at `renewsAt`, having earned `periods` discount steps.
async function subscriber({
  renewedAt,
  renewsAt,
  periods = 3,
  productId = MONTHLY,
  language = "fr",
}: {
  renewedAt: Date;
  renewsAt: Date;
  periods?: number;
  productId?: string;
  language?: string;
}) {
  return prisma.user.create({
    data: {
      email: `rem_${randomUUID()}@example.com`,
      name: "Reminder Test",
      password: "not-used",
      language,
      isPro: true,
      billingProvider: "google_play",
      proInterval: "month",
      proProductId: productId,
      proCurrentPeriodEnd: renewsAt,
      loyaltyPeriodsPaid: periods,
      loyaltyLastInvoiceId: `evt_${randomUUID()}`,
      loyaltyLastRenewalAt: renewedAt,
    },
  });
}

describe("loyalty reminders", () => {
  it("sends nothing in the first day after the renewal", async () => {
    const now = new Date();
    await subscriber({ renewedAt: new Date(now.getTime() - 3 * 3600_000), renewsAt: new Date(now.getTime() + 29 * DAY) });
    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 0, final: 0 });
  });

  it("sends the first reminder the day after, once, with the tier price", async () => {
    const now = new Date();
    const user = await subscriber({ renewedAt: new Date(now.getTime() - 26 * 3600_000), renewsAt: new Date(now.getTime() + 28 * DAY) });

    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 1, final: 0 });
    expect(outbox[0]!.to).toBe(user.email);
    expect(outbox[0]!.subject).toBe("Ta réduction GymsTrack est prête");
    expect(outbox[0]!.html).toContain("4,69$/mois"); // 4.99 − 3 × 0.10

    // Not again on the next hourly run.
    expect(await sendDueLoyaltyReminders(new Date(now.getTime() + 3600_000), send)).toEqual({ first: 0, final: 0 });
  });

  it("sends the final reminder 2 days before the next renewal, once", async () => {
    const renewedAt = new Date();
    const renewsAt = new Date(renewedAt.getTime() + 30 * DAY);
    await subscriber({ renewedAt, renewsAt });

    await sendDueLoyaltyReminders(new Date(renewedAt.getTime() + 2 * DAY), send); // first
    expect(await sendDueLoyaltyReminders(new Date(renewsAt.getTime() - 3 * DAY), send)).toEqual({ first: 0, final: 0 });
    expect(await sendDueLoyaltyReminders(new Date(renewsAt.getTime() - 47 * 3600_000), send)).toEqual({ first: 0, final: 1 });
    expect(outbox.at(-1)!.subject).toBe("Plus que 2 jours pour activer ta réduction");
    expect(await sendDueLoyaltyReminders(new Date(renewsAt.getTime() - 24 * 3600_000), send)).toEqual({ first: 0, final: 0 });
  });

  it("when both are due at once, sends only the final one", async () => {
    const now = new Date();
    await subscriber({ renewedAt: new Date(now.getTime() - 2 * DAY), renewsAt: new Date(now.getTime() + DAY) });
    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 0, final: 1 });
    expect(await sendDueLoyaltyReminders(new Date(now.getTime() + 3600_000), send)).toEqual({ first: 0, final: 0 });
  });

  it("a new renewal starts a new round of reminders", async () => {
    const now = new Date();
    const user = await subscriber({ renewedAt: new Date(now.getTime() - 2 * DAY), renewsAt: new Date(now.getTime() + 28 * DAY) });
    await sendDueLoyaltyReminders(now, send);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loyaltyPeriodsPaid: 4,
        loyaltyLastInvoiceId: `evt_${randomUUID()}`,
        loyaltyLastRenewalAt: new Date(now.getTime() + 28 * DAY),
        proCurrentPeriodEnd: new Date(now.getTime() + 58 * DAY),
      },
    });
    expect(await sendDueLoyaltyReminders(new Date(now.getTime() + 30 * DAY), send)).toEqual({ first: 1, final: 0 });
  });

  it("stays silent once the discount is activated (on the earned tier)", async () => {
    const now = new Date();
    await subscriber({
      renewedAt: new Date(now.getTime() - 2 * DAY),
      renewsAt: new Date(now.getTime() + DAY),
      productId: "gymstrack_pro_monthly:monthly-l3",
    });
    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 0, final: 0 });
  });

  it("never emails Stripe subscribers (their discount applies by itself)", async () => {
    const now = new Date();
    const user = await subscriber({ renewedAt: new Date(now.getTime() - 2 * DAY), renewsAt: new Date(now.getTime() + DAY) });
    await prisma.user.update({ where: { id: user.id }, data: { billingProvider: "stripe" } });
    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 0, final: 0 });
  });

  it("writes in the user's language", async () => {
    const now = new Date();
    await subscriber({ renewedAt: new Date(now.getTime() - 26 * 3600_000), renewsAt: new Date(now.getTime() + 28 * DAY), language: "en" });
    await sendDueLoyaltyReminders(now, send);
    expect(outbox[0]!.subject).toBe("Your GymsTrack discount is ready");
    expect(outbox[0]!.html).toContain("4.69$/month");
  });

  it("retries on the next run when sending failed", async () => {
    const now = new Date();
    await subscriber({ renewedAt: new Date(now.getTime() - 26 * 3600_000), renewsAt: new Date(now.getTime() + 28 * DAY) });
    const failing = async () => {
      throw new Error("Resend down");
    };
    expect(await sendDueLoyaltyReminders(now, failing)).toEqual({ first: 0, final: 0 });
    expect(await sendDueLoyaltyReminders(now, send)).toEqual({ first: 1, final: 0 });
  });
});
