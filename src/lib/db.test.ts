import { test, expect } from "bun:test";
import { openDb, migrate, getDb, _resetDbForTests } from "./db";
import { withEnv } from "./test-helpers";

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

test("getDb creates missing parent directories for custom BUN_DB_PATH", async () => {
  const path = `/tmp/opencode/db-test-${crypto.randomUUID()}/nested/orders.sqlite`;
  await withEnv({ BUN_DB_PATH: path }, () => {
    const db = getDb();
    const count = db.query(`SELECT count(*) as n FROM orders`).get() as { n: number };
    expect(count.n).toBe(0);
  });
  _resetDbForTests(":memory:");
});
