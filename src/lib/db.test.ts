import { test, expect } from "bun:test";
import { openDb, migrate } from "./db";

test("migrate creates orders table with expected columns", () => {
  const db = openDb(":memory:");
  migrate(db);
  const cols = db.query(`PRAGMA table_info(orders)`).all() as { name: string }[];
  const names = cols.map((c) => c.name);
  expect(names).toContain("id");
  expect(names).toContain("invoice_id");
  expect(names).toContain("plan_id");
  expect(names).toContain("amount_idr");
  expect(names).toContain("status");
  expect(names).toContain("expires_at");
  expect(names).toContain("discord_notified");
});

test("migrate is idempotent", () => {
  const db = openDb(":memory:");
  migrate(db);
  migrate(db);
  const count = db.query(`SELECT count(*) as n FROM orders`).get() as { n: number };
  expect(count.n).toBe(0);
});
