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
import { CSRF_COOKIE, CSRF_FIELD } from "../lib/auth/csrf";
import { Hono } from "hono";
import { adminRoutes } from "./routes";
import { withEnv } from "../lib/test-helpers";

const url = getTestDatabaseUrl();
const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  amountIdr: 40000,
  priceLabel: "Rp40.000",
  duration: "7 hari",
};

const PASS = "correct-horse-battery";

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

function parseCookies(setCookie: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!setCookie) return out;
  // fetch may join multiple Set-Cookie; split carefully
  for (const part of setCookie.split(/,(?=\s*[^;]+=)/)) {
    const m = part.trim().match(/^([^=]+)=([^;]*)/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function loginSession(username: string, password: string): Promise<string> {
  const loginPage = await app.fetch(new Request("http://x/admin/login"));
  const cookies = parseCookies(loginPage.headers.get("set-cookie"));
  const csrf = cookies[CSRF_COOKIE];
  expect(csrf).toBeTruthy();

  const res = await app.fetch(
    new Request("http://x/admin/login", {
      method: "POST",
      body: new URLSearchParams({
        username,
        password,
        [CSRF_FIELD]: csrf!,
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: `${CSRF_COOKIE}=${csrf}`,
      },
      redirect: "manual",
    })
  );
  const setCookie = res.headers.get("set-cookie") || "";
  const all = parseCookies(setCookie);
  // merge with previous csrf if not rotated in same header parse
  const session = all.admin_session || setCookie.match(/admin_session=([^;]+)/)?.[1];
  const newCsrf = all[CSRF_COOKIE] || csrf;
  expect(session).toBeTruthy();
  return `admin_session=${session}; ${CSRF_COOKIE}=${newCsrf}`;
}

function csrfFromCookieHeader(cookie: string): string {
  const m = cookie.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  return m?.[1] ?? "";
}

test("GET /admin redirects to login", async () => {
  if (skip()) return;
  const res = await app.fetch(new Request("http://x/admin", { redirect: "manual" }));
  expect([302, 301]).toContain(res.status);
  expect(res.headers.get("location") || "").toContain("/admin/login");
});

test("login success sets cookie", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  const loginPage = await app.fetch(new Request("http://x/admin/login"));
  const cookies = parseCookies(loginPage.headers.get("set-cookie"));
  const csrf = cookies[CSRF_COOKIE];
  const res = await app.fetch(
    new Request("http://x/admin/login", {
      method: "POST",
      body: new URLSearchParams({
        username: "admin",
        password: PASS,
        [CSRF_FIELD]: csrf!,
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: `${CSRF_COOKIE}=${csrf}`,
      },
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("set-cookie") || "").toContain("admin_session=");
});

test("login without CSRF fails", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  const res = await app.fetch(
    new Request("http://x/admin/login", {
      method: "POST",
      body: new URLSearchParams({ username: "admin", password: PASS }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location") || "").toContain("error=auth");
  expect(res.headers.get("set-cookie") || "").not.toContain("admin_session=");
});

test("dashboard with session returns 200", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  const cookie = await loginSession("admin", PASS);
  const res = await app.fetch(new Request("http://x/admin", { headers: { cookie } }));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Pending");
  expect(res.headers.get("x-frame-options")).toBe("DENY");
  expect(res.headers.get("content-security-policy") || "").toContain("frame-ancestors 'none'");
});

test("orders list shows seeded order email", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  await createOrder(getDb(), { id: "ord-list", plan, email: "buyer@x.co" });
  const cookie = await loginSession("admin", PASS);
  const res = await app.fetch(
    new Request("http://x/admin/orders", { headers: { cookie } })
  );
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("buyer@x.co");
});

test("self-deactivate forbidden", async () => {
  if (skip()) return;
  const u = await createAdminUser(getDb(), { username: "admin", password: PASS });
  const cookie = await loginSession("admin", PASS);
  const csrf = csrfFromCookieHeader(cookie);
  const res = await app.fetch(
    new Request(`http://x/admin/users/${u.id}/deactivate`, {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ [CSRF_FIELD]: csrf }),
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location") || "").toContain("cannot-self-deactivate");
});

test("POST without CSRF is rejected", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  await createOrder(getDb(), { id: "ord-csrf", plan, email: "a@b.co" });
  await markPaid(getDb(), "ord-csrf", new Date().toISOString(), 40000);
  const cookie = await loginSession("admin", PASS);
  const res = await app.fetch(
    new Request("http://x/admin/orders/ord-csrf/fulfill", {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ note: "sent" }),
      redirect: "manual",
    })
  );
  expect(res.status).toBe(403);
});

test("fulfill paid order via POST", async () => {
  if (skip()) return;
  const u = await createAdminUser(getDb(), { username: "admin", password: PASS });
  await createOrder(getDb(), { id: "ord-ff", plan, email: "a@b.co" });
  await markPaid(getDb(), "ord-ff", new Date().toISOString(), 40000);
  const cookie = await loginSession("admin", PASS);
  const csrf = csrfFromCookieHeader(cookie);
  const res = await app.fetch(
    new Request("http://x/admin/orders/ord-ff/fulfill", {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ note: "sent", [CSRF_FIELD]: csrf }),
      redirect: "manual",
    })
  );
  expect(res.status).toBe(302);
  expect(res.headers.get("location") || "").toContain("ok=fulfilled");
  void u;
});

test("admin works under a custom ADMIN_PATH prefix", async () => {
  if (skip()) return;
  await createAdminUser(getDb(), { username: "admin", password: PASS });
  await withEnv({ ADMIN_PATH: "/my-secret" }, async () => {
    const customApp = new Hono();
    customApp.route("/my-secret", adminRoutes);
    const res = await customApp.fetch(new Request("http://x/my-secret", { redirect: "manual" }));
    expect([302, 301]).toContain(res.status);
    expect(res.headers.get("location") || "").toContain("/my-secret/login");
  });
});
