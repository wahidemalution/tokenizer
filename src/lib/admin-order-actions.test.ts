import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
  createDb,
  closeSql,
} from "../db/test-utils";
import type { AppDb, Sql } from "../db/client";
import { createOrder, setInvoice } from "./orders";
import { listPaymentEventsForOrder } from "./payment-events";
import { recheckOrderPayment } from "./admin-order-actions";
import type { Plan } from "./plans";
import { withEnv } from "./test-helpers";

const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  basePriceIdr: 40000,
  discountPercent: 0,
  description: null,
  duration: "7 hari",
  isPopular: false,
  isLimited: false,
  isActive: true,
  sortOrder: 3,
  amountIdr: 40000,
  priceLabel: "Rp40.000",
};

const url = getTestDatabaseUrl();
let db: AppDb;
let sql: Sql;

function skip(): boolean {
  if (!url) {
    console.warn("SKIP recheck tests: no DB URL");
    return true;
  }
  return false;
}

beforeAll(async () => {
  if (!url) return;
  await migrateTestDb(url);
  const c = createDb(url);
  db = c.db;
  sql = c.sql;
});

beforeEach(async () => {
  if (!url) return;
  await truncateAll(db);
});

afterAll(async () => {
  if (sql) await closeSql(sql);
});

test("recheck marks paid when bayar says paid", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-1", plan, email: "a@b.co" });
  await setInvoice(db, "ord-1", "INV-R", "https://pay.test/x");

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        status: "paid",
        final_amount: 40000,
        paid_at: new Date().toISOString(),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )) as typeof fetch;

  await withEnv(
    { BAYAR_GG_API_KEY: "k", DISCORD_WEBHOOK_URL: "https://discord.test/hook" },
    async () => {
      // mock discord too via same fetch — discord will 404, ok
      const prev = globalThis.fetch;
      globalThis.fetch = (async (input: any) => {
        const u = typeof input === "string" ? input : input?.url ?? "";
        if (u.includes("check-payment")) {
          return new Response(
            JSON.stringify({
              success: true,
              status: "paid",
              final_amount: 40000,
              paid_at: new Date().toISOString(),
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        return new Response("", { status: 204 });
      }) as typeof fetch;

      const result = await recheckOrderPayment(db, "ord-1", "admin");
      expect(result.message).toBe("paid");
      const events = await listPaymentEventsForOrder(db, "ord-1");
      expect(events.at(-1)?.source).toBe("recheck");
      globalThis.fetch = prev;
    }
  );
});

test("recheck on paid order with failed discord notification retries discord", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-dc", plan, email: "a@b.co" });
  await setInvoice(db, "ord-dc", "INV-DC", "https://pay.test/x");

  let discordCalls = 0;
  const prev = globalThis.fetch;
  globalThis.fetch = (async (input: any) => {
    const u = typeof input === "string" ? input : input?.url ?? "";
    if (u.includes("check-payment")) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "paid",
          final_amount: 40000,
          paid_at: new Date().toISOString(),
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    if (u.includes("discord.test")) {
      discordCalls++;
      // First call fails, subsequent calls succeed
      return new Response("", { status: discordCalls === 1 ? 500 : 204 });
    }
    return new Response("", { status: 404 });
  }) as typeof fetch;

  await withEnv(
    { BAYAR_GG_API_KEY: "k", DISCORD_WEBHOOK_URL: "https://discord.test/hook" },
    async () => {
      // First recheck: marks paid, discord fails (500)
      const first = await recheckOrderPayment(db, "ord-dc", "admin");
      expect(first.message).toBe("paid");
      expect(discordCalls).toBe(1);
      expect(first.order!.status).toBe("paid");
      expect((await import("./orders")).getOrderById);
      const { getOrderById } = await import("./orders");
      let order = await getOrderById(db, "ord-dc");
      expect(order!.discordNotified).toBe(false);

      // Second recheck: order already paid but NOT notified — must retry discord
      const second = await recheckOrderPayment(db, "ord-dc", "admin");
      expect(second.message).toBe("already-paid");
      expect(discordCalls).toBe(2);
      order = await getOrderById(db, "ord-dc");
      expect(order!.discordNotified).toBe(true);
    }
  );
  globalThis.fetch = prev;
});
