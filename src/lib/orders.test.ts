import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
  createDb,
  closeSql,
} from "../db/test-utils";
import type { AppDb, Sql } from "../db/client";
import {
  createOrder,
  getOrderById,
  expireIfDue,
  markPaid,
  setDiscordNotified,
  setInvoice,
  getOrderByInvoice,
  isPaidAmountAcceptable,
  findReusablePending,
  setExpiresAt,
  setCreatedAt,
  markFulfilled,
  listOrders,
  getDashboardStats,
} from "./orders";
import type { Plan } from "./plans";

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

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function skip(): boolean {
  if (!url) {
    console.warn("SKIP orders tests: no TEST_DATABASE_URL/DATABASE_URL");
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

test("createOrder inserts a pending order with 30m expiry", async () => {
  if (skip()) return;
  const o = await createOrder(db, { id: "ord-1", plan, email: "a@b.co" });
  expect(o.status).toBe("pending");
  expect(o.email).toBe("a@b.co");
  expect(o.amountIdr).toBe(40000);
  expect(o.discordNotified).toBe(false);
  expect(o.fulfilledAt).toBeNull();
  const created = new Date(o.createdAt).getTime();
  const expires = new Date(o.expiresAt).getTime();
  expect(expires - created).toBeGreaterThan(29 * 60 * 1000);
  expect(expires - created).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
});

test("getOrderById retrieves inserted order", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-2", plan, email: "a@b.co" });
  const o = await getOrderById(db, "ord-2");
  expect(o).not.toBeNull();
  expect(o!.id).toBe("ord-2");
});

test("expireIfDue flips pending past expires_at to expired", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-3", plan, email: "a@b.co" });
  await setExpiresAt(db, "ord-3", iso(-60_000));
  const after = await expireIfDue(db, (await getOrderById(db, "ord-3"))!);
  expect(after.status).toBe("expired");
});

test("expireIfDue leaves non-expired pending untouched", async () => {
  if (skip()) return;
  const o = await createOrder(db, { id: "ord-4", plan, email: "a@b.co" });
  const after = await expireIfDue(db, o);
  expect(after.status).toBe("pending");
});

test("expireIfDue does not overwrite paid when race with concurrent markPaid", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-race", plan, email: "a@b.co" });
  await setExpiresAt(db, "ord-race", iso(-60_000));
  const stalePending = (await getOrderById(db, "ord-race"))!;
  expect(stalePending.status).toBe("pending");
  await markPaid(db, "ord-race", iso(0), 40123);
  const after = await expireIfDue(db, stalePending);
  expect(after.status).toBe("paid");
  expect((await getOrderById(db, "ord-race"))!.status).toBe("paid");
});

test("isPaidAmountAcceptable allows exact amount only", () => {
  expect(isPaidAmountAcceptable(40000, 40000)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 40123)).toBe(false);
  expect(isPaidAmountAcceptable(40000, 40999)).toBe(false);
  expect(isPaidAmountAcceptable(40000, 41000)).toBe(false);
  expect(isPaidAmountAcceptable(40000, 39999)).toBe(false);
  expect(isPaidAmountAcceptable(40000, null)).toBe(false);
  expect(isPaidAmountAcceptable(40000, undefined)).toBe(false);
});

test("markPaid sets paid status and final amount, idempotent on status", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-5", plan, email: "a@b.co" });
  const a = await markPaid(db, "ord-5", iso(0), 40123);
  expect(a.order.status).toBe("paid");
  expect(a.order.finalAmountIdr).toBe(40123);
  expect(a.transitioned).toBe(true);
  const b = await markPaid(db, "ord-5", iso(0), 40123);
  expect(b.order.status).toBe("paid");
  expect(b.transitioned).toBe(false);
});

test("setInvoice stores invoice id and payment url", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-6", plan, email: "a@b.co" });
  await setInvoice(db, "ord-6", "BAYAR-123", "https://pay.test/x");
  const o = await getOrderByInvoice(db, "BAYAR-123");
  expect(o).not.toBeNull();
  expect(o!.paymentUrl).toBe("https://pay.test/x");
});

test("setDiscordNotified sets flag", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-7", plan, email: "a@b.co" });
  await setDiscordNotified(db, "ord-7");
  expect((await getOrderById(db, "ord-7"))!.discordNotified).toBe(true);
});

test("findReusablePending returns newest active pending for email+plan", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-old", plan, email: "a@b.co" });
  await setInvoice(db, "ord-old", "INV-OLD", "https://pay.test/old");
  await createOrder(db, { id: "ord-new", plan, email: "a@b.co" });
  await setInvoice(db, "ord-new", "INV-NEW", "https://pay.test/new");
  await setCreatedAt(db, "ord-new", iso(1000));
  const found = await findReusablePending(db, "a@b.co", "10m");
  expect(found).not.toBeNull();
  expect(found!.id).toBe("ord-new");
  expect(found!.paymentUrl).toBe("https://pay.test/new");
});

test("findReusablePending misses expired, other plan, paid, or missing url", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-exp", plan, email: "a@b.co" });
  await setInvoice(db, "ord-exp", "INV-E", "https://pay.test/e");
  await setExpiresAt(db, "ord-exp", iso(-60_000));
  expect(await findReusablePending(db, "a@b.co", "10m")).toBeNull();

  await createOrder(db, { id: "ord-plan", plan, email: "a@b.co" });
  await setInvoice(db, "ord-plan", "INV-P", "https://pay.test/p");
  expect(await findReusablePending(db, "a@b.co", "1m")).toBeNull();

  await createOrder(db, { id: "ord-paid", plan, email: "c@d.co" });
  await setInvoice(db, "ord-paid", "INV-PAID", "https://pay.test/paid");
  await markPaid(db, "ord-paid", iso(0), 40123);
  expect(await findReusablePending(db, "c@d.co", "10m")).toBeNull();

  await createOrder(db, { id: "ord-nourl", plan, email: "e@f.co" });
  expect(await findReusablePending(db, "e@f.co", "10m")).toBeNull();
});

test("markFulfilled only when paid", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-f", plan, email: "a@b.co" });
  const pending = await markFulfilled(db, "ord-f", "admin-1", "note");
  expect(pending).toBeNull();
  await markPaid(db, "ord-f", new Date().toISOString(), 40000);
  const ok = await markFulfilled(db, "ord-f", "admin-1", "sent key");
  expect(ok?.fulfilledBy).toBe("admin-1");
  expect(ok?.fulfillmentNote).toBe("sent key");
});

test("listOrders filters by status and q", async () => {
  if (skip()) return;
  await createOrder(db, { id: "a", plan, email: "one@x.co" });
  await createOrder(db, { id: "b", plan, email: "two@x.co" });
  await markPaid(db, "b", new Date().toISOString(), 40000);
  const { rows, total } = await listOrders(db, {
    status: "paid",
    q: "two",
    page: 1,
    perPage: 20,
  });
  expect(total).toBe(1);
  expect(rows[0].id).toBe("b");
});

test("getDashboardStats counts paid today Jakarta", async () => {
  if (skip()) return;
  await createOrder(db, { id: "p1", plan, email: "a@b.co" });
  await markPaid(db, "p1", new Date().toISOString(), 40100);
  const s = await getDashboardStats(db);
  expect(s.paidToday).toBeGreaterThanOrEqual(1);
  expect(s.revenueTodayIdr).toBeGreaterThanOrEqual(40100);
  expect(s.unfulfilledPaid).toBeGreaterThanOrEqual(1);
});
