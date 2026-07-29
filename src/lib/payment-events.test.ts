import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
  createDb,
  closeSql,
} from "../db/test-utils";
import type { AppDb, Sql } from "../db/client";
import { createOrder } from "./orders";
import { insertPaymentEvent, listPaymentEventsForOrder } from "./payment-events";
import type { Plan } from "./plans";

const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  amountIdr: 40000,
  priceLabel: "Rp40.000",
  duration: "7 hari",
};

const url = getTestDatabaseUrl();
let db: AppDb;
let sql: Sql;

function skip(): boolean {
  if (!url) {
    console.warn("SKIP payment-events tests: no DB URL");
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

test("insertPaymentEvent and list by order", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-pe", plan, email: "a@b.co" });
  await insertPaymentEvent(db, {
    orderId: "ord-pe",
    invoiceId: "INV-1",
    source: "webhook",
    rawBody: { invoice_id: "INV-1" },
    checkResult: { status: "paid" },
    processedOk: true,
    message: "paid",
  });
  const list = await listPaymentEventsForOrder(db, "ord-pe");
  expect(list).toHaveLength(1);
  expect(list[0].message).toBe("paid");
  expect(list[0].source).toBe("webhook");
});
