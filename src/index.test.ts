import { test, expect, beforeEach, afterAll } from "bun:test";
import { app } from "./index";
import { _resetDbForTests, getDb } from "./lib/db";
import { createOrder, setInvoice, getOrderById } from "./lib/orders";
import { PLANS } from "./lib/plans";
import { withEnv } from "./lib/test-helpers";

const DISCORD_URL = "https://discord.test/hook";
const plan = PLANS[2];

let discordCallCount = 0;

function setupFetch(opts: {
  bayarStatus: string;
  bayarFinalAmount?: number;
  bayarPaidAt?: string;
  discordStatus?: number;
}) {
  discordCallCount = 0;
  const discordStatus = opts.discordStatus ?? 204;
  globalThis.fetch = (async (input: any, _init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (url.startsWith("https://www.bayar.gg/api/check-payment.php")) {
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
    if (url === DISCORD_URL) {
      discordCallCount++;
      return new Response("", { status: discordStatus });
    }
    return new Response(JSON.stringify({ error: "no mock for " + url }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

function seedOrder(id: string, invoiceId: string, overrides?: { expiresAt?: string }) {
  const db = getDb();
  createOrder(db, { id, plan, email: "a@b.co" });
  setInvoice(db, id, invoiceId, "https://pay.test/x");
  if (overrides?.expiresAt) {
    db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(overrides.expiresAt, id);
  }
  return getOrderById(db, id)!;
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

const envVars = {
  BAYAR_GG_API_KEY: "k",
  DISCORD_WEBHOOK_URL: DISCORD_URL,
  BUN_DB_PATH: ":memory:",
};

beforeEach(() => {
  _resetDbForTests(":memory:");
});

// Bersihkan singleton db agar file test lain (mis. db.test.ts) tidak mewarisi
// koneksi in-memory berisi order hasil seeding file ini.
afterAll(() => {
  _resetDbForTests(":memory:");
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

test("spoofed webhook (checkPayment says not-paid) -> 202 not-paid", async () => {
  seedOrder("ord-spoof", "INV-SPOOF");
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-SPOOF");
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.message).toBe("not-paid");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-spoof");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("verified paid webhook -> 200 paid, order paid + discordNotified", async () => {
  seedOrder("ord-paid", "INV-PAID");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-PAID");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("paid");
    expect(discordCallCount).toBe(1);
    const order = getOrderById(getDb(), "ord-paid");
    expect(order!.status).toBe("paid");
    expect(order!.finalAmountIdr).toBe(40123);
    expect(order!.discordNotified).toBe(true);
  });
});

test("paid with underpaid final_amount -> amount-mismatch, order stays pending", async () => {
  seedOrder("ord-under", "INV-UNDER");
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
    expect(body.message).toBe("amount-mismatch");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-under");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("double webhook -> second returns 200 already-paid", async () => {
  seedOrder("ord-double", "INV-DOUBLE");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
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
    expect(body.message).toBe("already-paid");
    expect(discordCallCount).toBe(1);

    const order = getOrderById(getDb(), "ord-double");
    expect(order!.status).toBe("paid");
    expect(order!.discordNotified).toBe(true);
  });
});

test("expired order webhook -> 200 expired, no discord fetch", async () => {
  seedOrder("ord-expired", "INV-EXPIRED", {
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
    expect(body.message).toBe("expired");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-expired");
    expect(order!.status).toBe("expired");
    expect(order!.discordNotified).toBe(false);
  });
});
