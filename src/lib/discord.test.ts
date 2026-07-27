import { test, expect } from "bun:test";
import { buildPaidEmbed, sendPaidNotification } from "./discord";
import { withEnv, mockFetch } from "./test-helpers";
import type { Order } from "./orders";

function mkOrder(over: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    invoiceId: "BAYAR-1",
    planId: "10m",
    planName: "10M",
    tokens: "10M token",
    amountIdr: 40000,
    finalAmountIdr: 40123,
    email: "a@b.co",
    discordId: "user#1234",
    whatsapp: "628123456789",
    telegram: null,
    status: "paid",
    paymentUrl: "https://pay.test/x",
    paidAt: "2026-07-23T12:30:00.000Z",
    expiresAt: "2026-07-23T13:00:00.000Z",
    discordNotified: false,
    createdAt: "2026-07-23T12:25:00.000Z",
    updatedAt: "2026-07-23T12:30:00.000Z",
    ...over,
  };
}

test("buildPaidEmbed includes plan, email, amount, invoice, and omits empty optionals", () => {
  const payload = buildPaidEmbed(mkOrder({ telegram: null, whatsapp: null, discordId: null })) as any;
  const embed = payload.embeds[0];
  expect(embed.title).toContain("10M");
  const fields = embed.fields as { name: string; value: string }[];
  const byName = Object.fromEntries(fields.map((f) => [f.name, f.value]));
  expect(byName["Email"]).toBe("a@b.co");
  expect(byName["Invoice"]).toBe("BAYAR-1");
  expect(byName["Harga"]).toContain("40123");
  expect(byName["Plan"]).toContain("10M");
  expect("Discord" in byName).toBe(false);
  expect("WhatsApp" in byName).toBe(false);
});

test("buildPaidEmbed includes discord/whatsapp when present", () => {
  const payload = buildPaidEmbed(mkOrder()) as any;
  const byName = Object.fromEntries(payload.embeds[0].fields.map((f: any) => [f.name, f.value]));
  expect(byName["Discord"]).toBe("user#1234");
  expect(byName["WhatsApp"]).toBe("628123456789");
});

test("sendPaidNotification returns ok on 204", async () => {
  globalThis.fetch = mockFetch({
    "https://discord.test/hook": { status: 204, body: "" },
  }) as any;
  await withEnv({ DISCORD_WEBHOOK_URL: "https://discord.test/hook" }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(true);
  });
});

test("sendPaidNotification returns error on failure", async () => {
  globalThis.fetch = mockFetch({
    "https://discord.test/hook": { status: 500, body: { err: "x" } },
  }) as any;
  await withEnv({ DISCORD_WEBHOOK_URL: "https://discord.test/hook" }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

test("sendPaidNotification returns error when webhook url missing", async () => {
  await withEnv({ DISCORD_WEBHOOK_URL: undefined }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(false);
    expect(r.error).toBe("webhook-not-configured");
  });
});
