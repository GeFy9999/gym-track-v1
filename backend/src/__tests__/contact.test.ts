import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

const sent = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (email: Record<string, unknown>) => {
        sent.push(email);
        return { id: "test" };
      },
    };
  },
}));

const { app } = await import("../app.js");

beforeEach(() => {
  sent.length = 0;
});

const valid = {
  name: "Alex <b>Test</b>",
  email: "alex@example.com",
  topic: "billing",
  message: "Bonjour, j'ai une question sur mon abonnement.",
};

describe("contact form", () => {
  it("forwards a valid message to support, replying to the sender, HTML-escaped", async () => {
    const res = await request(app).post("/api/contact").send(valid);
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "support@gymstrack.com",
      replyTo: "alex@example.com",
      subject: "[Contact] Abonnement / paiement — Alex <b>Test</b>",
    });
    expect(sent[0]!.html).toContain("Alex &lt;b&gt;Test&lt;/b&gt;");
    expect(sent[0]!.html).not.toContain("<b>Test</b>");
  });

  it("silently drops bots that fill the honeypot", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, website: "spam.example" });
    expect(res.status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  it("rejects invalid fields", async () => {
    expect((await request(app).post("/api/contact").send({ ...valid, email: "nope" })).status).toBe(400);
    expect((await request(app).post("/api/contact").send({ ...valid, message: "short" })).status).toBe(400);
    expect(sent).toHaveLength(0);
  });
});
