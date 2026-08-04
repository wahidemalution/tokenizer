import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { app } from "./index";
import { _resetDbForTests, getDb, closeDb } from "./lib/db";
import {
  createOrder,
  setInvoice,
  getOrderById,
  setExpiresAt,
  markPaid,
} from "./lib/orders";
import { listPaymentEventsForOrder } from "./lib/payment-events";
import { paymentEvents } from "./db/schema";
import { PLANS, seedPlansIfEmpty } from "./lib/plans";
import { withEnv } from "./lib/test-helpers";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
} from "./db/test-utils";
import { createOrderViewToken } from "./lib/order-view-token";

const DISCORD_URL = "https://discord.test/hook";
const plan = PLANS[2];
const url = getTestDatabaseUrl();

let discordCallCount = 0;

function skip(): boolean {
  if (!url) {
    console.warn("SKIP index DB tests: no TEST_DATABASE_URL/DATABASE_URL");
    return true;
  }
  return false;
}

function setupFetch(opts: {
  bayarStatus: string;
  bayarFinalAmount?: number;
  bayarPaidAt?: string;
  discordStatus?: number;
}) {
  discordCallCount = 0;
  const discordStatus = opts.discordStatus ?? 204;
  globalThis.fetch = (async (input: any, _init?: any) => {
    const u = typeof input === "string" ? input : input?.url ?? "";
    if (u.startsWith("https://www.bayar.gg/api/check-payment.php")) {
      return new Response(
        JSON.stringify({
          success: true,
          status: opts.bayarStatus,
          final_amount: opts.bayarFinalAmount,
          paid_at: opts.bayarPaidAt,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    if (u === DISCORD_URL) {
      discordCallCount++;
      return new Response("", { status: discordStatus });
    }
    return new Response(JSON.stringify({ error: "no mock for " + u }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

async function seedOrder(id: string, invoiceId: string, overrides?: { expiresAt?: string }) {
  const db = getDb();
  await createOrder(db, { id, plan, email: "a@b.co" });
  await setInvoice(db, id, invoiceId, "https://pay.test/x");
  if (overrides?.expiresAt) {
    await setExpiresAt(db, id, overrides.expiresAt);
  }
  return (await getOrderById(db, id))!;
}

async function postWebhook(invoiceId: string) {
  return app.fetch(
    new Request("https://x.test/api/webhooks/bayar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
  );
}

async function postWebhookRaw(body: string) {
  return app.fetch(
    new Request("https://x.test/api/webhooks/bayar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    })
  );
}

async function countAllPaymentEvents(): Promise<number> {
  const rows = await getDb().select().from(paymentEvents);
  return rows.length;
}

const envVars = {
  BAYAR_GG_API_KEY: "k",
  DISCORD_WEBHOOK_URL: DISCORD_URL,
  DATABASE_URL: url ?? "",
};

beforeAll(async () => {
  if (!url) return;
  await migrateTestDb(url);
  await _resetDbForTests(url);
  await seedPlansIfEmpty(getDb());
});

beforeEach(async () => {
  if (!url) return;
  await truncateAll(getDb());
});

afterAll(async () => {
  await closeDb();
});

test("smoke: GET / returns 200 with brand", async () => {
  const res = await app.fetch(new Request("https://x.test/"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("TOKENIZER");
});

test("smoke: GET /pricing returns 200 with plans", async () => {
  const res = await app.fetch(new Request("https://x.test/pricing"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Pilih paket yang cocok");
  expect(html).toContain("Rp300.000");
});

test("smoke: GET /checkout with unknown plan redirects to /pricing", async () => {
  const res = await app.fetch(new Request("https://x.test/checkout?plan=999m"));
  expect(res.status).toBe(302);
});

test("smoke: GET /checkout with valid plan renders form", async () => {
  const res = await app.fetch(new Request("https://x.test/checkout?plan=10m"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Checkout");
  expect(html).toContain("Ringkasan paket");
});

test("spoofed webhook (checkPayment says not-paid) -> accepted, order stays pending", async () => {
  if (skip()) return;
  await seedOrder("ord-spoof", "INV-SPOOF");
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-SPOOF");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("accepted");
    expect(discordCallCount).toBe(0);
    const order = await getOrderById(getDb(), "ord-spoof");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("verified paid webhook -> 200 paid, order paid + discordNotified + event", async () => {
  if (skip()) return;
  await seedOrder("ord-paid", "INV-PAID");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 45000,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-PAID");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("accepted");
    expect(discordCallCount).toBe(1);
    const order = await getOrderById(getDb(), "ord-paid");
    expect(order!.status).toBe("paid");
    expect(order!.finalAmountIdr).toBe(45000);
    expect(order!.discordNotified).toBe(true);
    const events = await listPaymentEventsForOrder(getDb(), "ord-paid");
    expect(events.some((e) => e.message === "paid")).toBe(true);
  });
});

test("paid with underpaid final_amount -> amount-mismatch, order stays pending", async () => {
  if (skip()) return;
  await seedOrder("ord-under", "INV-UNDER");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 1000,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-UNDER");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("accepted");
    expect(discordCallCount).toBe(0);
    const order = await getOrderById(getDb(), "ord-under");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("double webhook -> second returns 200 already-paid", async () => {
  if (skip()) return;
  await seedOrder("ord-double", "INV-DOUBLE");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 45000,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const first = await postWebhook("INV-DOUBLE");
    expect(first.status).toBe(200);
    expect(discordCallCount).toBe(1);

    const second = await postWebhook("INV-DOUBLE");
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.message).toBe("accepted");
    expect(discordCallCount).toBe(1);

    const order = await getOrderById(getDb(), "ord-double");
    expect(order!.status).toBe("paid");
    expect(order!.discordNotified).toBe(true);
  });
});

test("expired order webhook -> 200 expired, no discord fetch", async () => {
  if (skip()) return;
  await seedOrder("ord-expired", "INV-EXPIRED", {
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-EXPIRED");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("accepted");
    expect(discordCallCount).toBe(0);
    const order = await getOrderById(getDb(), "ord-expired");
    expect(order!.status).toBe("expired");
    expect(order!.discordNotified).toBe(false);
  });
});

test("order success without view token redirects home", async () => {
  if (skip()) return;
  await seedOrder("ord-view", "INV-VIEW");
  await withEnv({ ...envVars, ORDER_VIEW_SECRET: "unit-view-secret-12" }, async () => {
    const res = await app.fetch(
      new Request("https://x.test/order/success?order=ord-view")
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });
});

test("order success with valid view token shows masked email", async () => {
  if (skip()) return;
  await seedOrder("ord-view-ok", "INV-VIEW-OK");
  await markPaid(getDb(), "ord-view-ok", new Date().toISOString(), 45123);
  await withEnv({ ...envVars, ORDER_VIEW_SECRET: "unit-view-secret-12" }, async () => {
    const t = createOrderViewToken("ord-view-ok");
    const res = await app.fetch(
      new Request(`https://x.test/order/success?order=ord-view-ok&t=${t}`)
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Pembayaran diterima");
    expect(html).toContain("a***@b.co");
    expect(html).not.toContain(">a@b.co<");
  });
});

test("security headers present on home", async () => {
  const res = await app.fetch(new Request("https://x.test/"));
  expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
});

test("webhook rejects oversized content-length", async () => {
  const res = await app.fetch(
    new Request("https://x.test/api/webhooks/bayar", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(200_000),
      },
      body: "{}",
    })
  );
  expect(res.status).toBe(413);
});

test("unknown invoice writes no payment_events row", async () => {
  if (skip()) return;
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-NEVER-EXISTED");
    expect(res.status).toBe(200);
    expect(await countAllPaymentEvents()).toBe(0);
  });
});

test("unparseable body writes no payment_events row", async () => {
  if (skip()) return;
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhookRaw("not-json{{{");
    expect(res.status).toBe(200);
    expect(await countAllPaymentEvents()).toBe(0);
  });
});

test("missing invoice_id writes no payment_events row", async () => {
  if (skip()) return;
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhookRaw(JSON.stringify({ status: "paid" }));
    expect(res.status).toBe(200);
    expect(await countAllPaymentEvents()).toBe(0);
  });
});

test("anonymous flood of unknown invoices cannot grow payment_events", async () => {
  if (skip()) return;
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    for (let i = 0; i < 25; i++) await postWebhook(`INV-FLOOD-${i}`);
    expect(await countAllPaymentEvents()).toBe(0);
  });
});

test("unknown and expired invoices return identical bodies (no enumeration oracle)", async () => {
  if (skip()) return;
  await seedOrder("ord-oracle", "INV-ORACLE", {
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  setupFetch({ bayarStatus: "paid", bayarFinalAmount: 45000 });
  await withEnv(envVars, async () => {
    const known = await postWebhook("INV-ORACLE");
    const unknown = await postWebhook("INV-NO-SUCH-INVOICE");
    expect(known.status).toBe(unknown.status);
    expect(await known.json()).toEqual(await unknown.json());
  });
});

test("not-paid and amount-mismatch are indistinguishable to the caller", async () => {
  if (skip()) return;
  await seedOrder("ord-np", "INV-NP");
  setupFetch({ bayarStatus: "pending" });
  let notPaidStatus = 0;
  let notPaidBody: unknown;
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-NP");
    notPaidStatus = res.status;
    notPaidBody = await res.json();
  });

  await truncateAll(getDb());
  await seedOrder("ord-am", "INV-AM");
  setupFetch({ bayarStatus: "paid", bayarFinalAmount: 1 });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-AM");
    expect(res.status).toBe(notPaidStatus);
    expect(await res.json()).toEqual(notPaidBody);
  });
});

test("uniform response still records precise reason in payment_events for admins", async () => {
  if (skip()) return;
  await seedOrder("ord-reason", "INV-REASON");
  setupFetch({ bayarStatus: "paid", bayarFinalAmount: 1 });
  await withEnv(envVars, async () => {
    await postWebhook("INV-REASON");
    const events = await listPaymentEventsForOrder(getDb(), "ord-reason");
    expect(events.map((e) => e.message)).toContain("amount-mismatch");
    const order = await getOrderById(getDb(), "ord-reason");
    expect(order!.status).toBe("pending");
  });
});

// --- Discord failure recovery: paid stays paid, notification retried on next webhook ---

test("discord fails on first webhook -> order still paid, retry on next webhook notifies", async () => {
  if (skip()) return;
  await seedOrder("ord-dc-retry", "INV-DC-RETRY");
  // First webhook: payment verified paid, but Discord returns 500
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 45000,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 500,
  });
  await withEnv(envVars, async () => {
    const first = await postWebhook("INV-DC-RETRY");
    expect(first.status).toBe(200);
    expect(discordCallCount).toBe(1);

    // Payment MUST be recorded as paid even though Discord failed
    let order = await getOrderById(getDb(), "ord-dc-retry");
    expect(order!.status).toBe("paid");
    expect(order!.discordNotified).toBe(false); // not marked notified

    // Second webhook delivery (bayar.gg retry): Discord now healthy
    setupFetch({
      bayarStatus: "paid",
      bayarFinalAmount: 45000,
      bayarPaidAt: "2026-07-24 12:30:00",
      discordStatus: 204,
    });
    const second = await postWebhook("INV-DC-RETRY");
    expect(second.status).toBe(200);
    expect(discordCallCount).toBe(1); // retried once in this fetch session

    order = await getOrderById(getDb(), "ord-dc-retry");
    expect(order!.status).toBe("paid");
    expect(order!.discordNotified).toBe(true); // now notified
  });
});
