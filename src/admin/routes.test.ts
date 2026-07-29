import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { app } from "../index";
import { _resetDbForTests, getDb, closeDb } from "../lib/db";
import { createAdminUser } from "../lib/admin-users";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
} from "../db/test-utils";
import { createOrder, markPaid } from "../lib/orders";
import type { Plan } from "../lib/plans";

const url = getTestDatabaseUrl();
const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  amountIdr: 40000,
  priceLabel: "Rp40.000",
  duration: "7 hari",
};

function skip(): boolean {
  if (!url) {
    console.warn("SKIP admin routes: no DB URL");
    return true;
  }
  return false;
}

beforeAll(async () => {
  if (!url) return;
  await migrateTestDb(url);
  await _resetDbForTests(url);
});

beforeEach(async () => {
  if (!url) return;
  await truncateAll(getDb());
});

afterAll(async () => {
  await closeDb();
});

async function loginCookie(username: string, password: string): Promise<string> {
  const res = await app.fetch(
    new Request("http://x/admin/login", {
      method: "POST",
      body: new URLSearchParams({ username, password }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    })
  );
  const setCookie = res.headers.get("set-cookie") || "";
  const m = setCookie.match(/admin_session=([^;]+)/);
  return m ? `admin_session=${m[1]}` : "";
}

test("GET /admin redirects to login", async () => {
  if (skip()) return;
  const res = await app.fetch(new Request("http://x/admin", { redirect: "manual" }));
  expect([302, 301]).toContain(res.status);
  expect(res.headers.get("location") || "").toContain("/admin/login");
});

test("login success sets cookie", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: "correct-horse" });
  const res = await app.fetch(
    new Request("http://x/admin/login", {
      method: "POST",
      body: new URLSearchParams({ username: "admin", password: "correct-horse" }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("set-cookie") || "").toContain("admin_session=");
});

test("dashboard with session returns 200", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: "correct-horse" });
  const cookie = await loginCookie("admin", "correct-horse");
  const res = await app.fetch(
    new Request("http://x/admin", { headers: { cookie } })
  );
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Pending");
});

test("orders list shows seeded order email", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: "correct-horse" });
  await createOrder(getDb(), { id: "ord-list", plan, email: "buyer@x.co" });
  const cookie = await loginCookie("admin", "correct-horse");
  const res = await app.fetch(
    new Request("http://x/admin/orders", { headers: { cookie } })
  );
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("buyer@x.co");
});

test("self-deactivate forbidden", async () => {
  if (skip()) return;
  const u = await createAdminUser(getDb(), { username: "admin", password: "correct-horse" });
  const cookie = await loginCookie("admin", "correct-horse");
  const res = await app.fetch(
    new Request(`http://x/admin/users/${u.id}/deactivate`, {
      method: "POST",
      headers: { cookie },
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location") || "").toContain("cannot-self-deactivate");
});

test("fulfill paid order via POST", async () => {
  if (skip()) return;
  const u = await createAdminUser(getDb(), { username: "admin", password: "correct-horse" });
  await createOrder(getDb(), { id: "ord-ff", plan, email: "a@b.co" });
  await markPaid(getDb(), "ord-ff", new Date().toISOString(), 40000);
  const cookie = await loginCookie("admin", "correct-horse");
  const res = await app.fetch(
    new Request("http://x/admin/orders/ord-ff/fulfill", {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ note: "sent" }),
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location") || "").toContain("ok=fulfilled");
  void u;
});
