import { test, expect } from "bun:test";
import { _resetDbForTests } from "./db";
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
} from "./orders";
import type { Plan } from "./plans";

const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  amountIdr: 40000,
  priceLabel: "Rp40.000",
  duration: "7 hari",
};

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function freshDb() {
  return _resetDbForTests(":memory:");
}

test("createOrder inserts a pending order with 30m expiry", () => {
  const db = freshDb();
  const o = createOrder(db, { id: "ord-1", plan, email: "a@b.co" });
  expect(o.status).toBe("pending");
  expect(o.email).toBe("a@b.co");
  expect(o.amountIdr).toBe(40000);
  expect(o.discordNotified).toBe(false);
  const created = new Date(o.createdAt).getTime();
  const expires = new Date(o.expiresAt).getTime();
  expect(expires - created).toBeGreaterThan(29 * 60 * 1000);
  expect(expires - created).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
});

test("getOrderById retrieves inserted order", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-2", plan, email: "a@b.co" });
  const o = getOrderById(db, "ord-2");
  expect(o).not.toBeNull();
  expect(o!.id).toBe("ord-2");
});

test("expireIfDue flips pending past expires_at to expired", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-3", plan, email: "a@b.co" });
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-3");
  const after = expireIfDue(db, getOrderById(db, "ord-3")!);
  expect(after.status).toBe("expired");
});

test("expireIfDue leaves non-expired pending untouched", () => {
  const db = freshDb();
  const o = createOrder(db, { id: "ord-4", plan, email: "a@b.co" });
  const after = expireIfDue(db, o);
  expect(after.status).toBe("pending");
});

test("expireIfDue does not overwrite paid when race with concurrent markPaid", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-race", plan, email: "a@b.co" });
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-race");
  const stalePending = getOrderById(db, "ord-race")!;
  expect(stalePending.status).toBe("pending");
  markPaid(db, "ord-race", iso(0), 40123);
  const after = expireIfDue(db, stalePending);
  expect(after.status).toBe("paid");
  expect(getOrderById(db, "ord-race")!.status).toBe("paid");
});

test("isPaidAmountAcceptable allows exact and unique-code variance", () => {
  expect(isPaidAmountAcceptable(40000, 40000)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 40123)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 40999)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 41000)).toBe(false);
  expect(isPaidAmountAcceptable(40000, 39999)).toBe(false);
  expect(isPaidAmountAcceptable(40000, null)).toBe(false);
  expect(isPaidAmountAcceptable(40000, undefined)).toBe(false);
});

test("markPaid sets paid status and final amount, idempotent on status", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-5", plan, email: "a@b.co" });
  const a = markPaid(db, "ord-5", iso(0), 40123);
  expect(a.order.status).toBe("paid");
  expect(a.order.finalAmountIdr).toBe(40123);
  expect(a.transitioned).toBe(true);
  const b = markPaid(db, "ord-5", iso(0), 40123);
  expect(b.order.status).toBe("paid");
  expect(b.transitioned).toBe(false);
});

test("setInvoice stores invoice id and payment url", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-6", plan, email: "a@b.co" });
  setInvoice(db, "ord-6", "BAYAR-123", "https://pay.test/x");
  const o = getOrderByInvoice(db, "BAYAR-123");
  expect(o).not.toBeNull();
  expect(o!.paymentUrl).toBe("https://pay.test/x");
});

test("setDiscordNotified sets flag", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-7", plan, email: "a@b.co" });
  setDiscordNotified(db, "ord-7");
  expect(getOrderById(db, "ord-7")!.discordNotified).toBe(true);
});

test("findReusablePending returns newest active pending for email+plan", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-old", plan, email: "a@b.co" });
  setInvoice(db, "ord-old", "INV-OLD", "https://pay.test/old");
  createOrder(db, { id: "ord-new", plan, email: "a@b.co" });
  setInvoice(db, "ord-new", "INV-NEW", "https://pay.test/new");
  db.query(`UPDATE orders SET created_at = ? WHERE id = ?`).run(iso(1000), "ord-new");
  const found = findReusablePending(db, "a@b.co", "10m");
  expect(found).not.toBeNull();
  expect(found!.id).toBe("ord-new");
  expect(found!.paymentUrl).toBe("https://pay.test/new");
});

test("findReusablePending misses expired, other plan, paid, or missing url", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-exp", plan, email: "a@b.co" });
  setInvoice(db, "ord-exp", "INV-E", "https://pay.test/e");
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-exp");
  expect(findReusablePending(db, "a@b.co", "10m")).toBeNull();

  createOrder(db, { id: "ord-plan", plan, email: "a@b.co" });
  setInvoice(db, "ord-plan", "INV-P", "https://pay.test/p");
  expect(findReusablePending(db, "a@b.co", "1m")).toBeNull();

  createOrder(db, { id: "ord-paid", plan, email: "c@d.co" });
  setInvoice(db, "ord-paid", "INV-PAID", "https://pay.test/paid");
  markPaid(db, "ord-paid", iso(0), 40123);
  expect(findReusablePending(db, "c@d.co", "10m")).toBeNull();

  createOrder(db, { id: "ord-nourl", plan, email: "e@f.co" });
  expect(findReusablePending(db, "e@f.co", "10m")).toBeNull();
});
