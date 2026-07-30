import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { renderToString } from "hono/jsx/dom/server";
import { getDb } from "../db/client";
import {
  findAdminByUsername,
  createAdminUser,
  listAdminUsers,
  setAdminActive,
  setAdminPassword,
  wouldDeactivateLastActiveAdmin,
} from "../lib/admin-users";
import { verifyPassword } from "../lib/auth/password";
import { getDummyPasswordHash, validateAdminPassword } from "../lib/auth/password-policy";
import {
  createSession,
  destroySession,
  destroySessionsForUser,
  getSessionUser,
  purgeExpiredSessions,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from "../lib/auth/session";
import {
  clearCsrfCookieOptions,
  CSRF_COOKIE,
  CSRF_FIELD,
  csrfTokensMatch,
  generateCsrfToken,
  csrfCookieOptions,
} from "../lib/auth/csrf";
import { requireAdmin, parseAdminForm, type AdminEnv } from "../lib/auth/middleware";
import { safeAdminNext } from "../lib/auth/redirect";
import { rateLimitOk } from "../lib/rate-limit";
import { clientIp } from "../lib/client-ip";
import {
  clearFulfilled,
  getDashboardStats,
  getOrderById,
  listOrders,
  markFulfilled,
  type OrderStatus,
} from "../lib/orders";
import { listPaymentEventsForOrder } from "../lib/payment-events";
import { recheckOrderPayment } from "../lib/admin-order-actions";
import { AdminLayout } from "./layout";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { OrdersPage } from "./pages/orders";
import { OrderDetailPage } from "./pages/order-detail";
import { UsersPage } from "./pages/users";

const admin = new Hono<AdminEnv>();

admin.get("/login", async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(getDb(), sid);
  if (user) return c.redirect("/admin");
  const error = c.req.query("error");
  const next = c.req.query("next") ?? undefined;
  // Issue CSRF cookie for login form (double-submit)
  const csrf = generateCsrfToken();
  setCookie(c, CSRF_COOKIE, csrf, csrfCookieOptions(new Date(Date.now() + SESSION_TTL_MS)));
  const html = renderToString(<LoginPage error={error} next={next} csrfToken={csrf} />);
  return c.html(`<!doctype html>${html}`);
});

admin.post("/login", async (c) => {
  const ip = clientIp(c);
  if (!rateLimitOk(ip, { windowMs: 15 * 60_000, max: 10, bucket: "admin-login" })) {
    return c.redirect("/admin/login?error=rate");
  }
  const body = await c.req.parseBody();
  const cookieCsrf = getCookie(c, CSRF_COOKIE);
  const formCsrf = String(body[CSRF_FIELD] ?? "");
  if (!csrfTokensMatch(cookieCsrf, formCsrf)) {
    return c.redirect("/admin/login?error=auth");
  }
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const nextRaw = String(body.next ?? c.req.query("next") ?? "");

  // Constant-time-ish: always run verify against real or dummy hash
  const row = await findAdminByUsername(getDb(), username);
  const hash = row?.passwordHash ?? (await getDummyPasswordHash());
  const passwordOk = await verifyPassword(password, hash);
  if (!row || !row.isActive || !passwordOk) {
    return c.redirect("/admin/login?error=auth");
  }

  const db = getDb();
  const session = await createSession(db, row.id);
  setCookie(c, SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
  // Rotate CSRF on login
  const csrf = generateCsrfToken();
  setCookie(c, CSRF_COOKIE, csrf, csrfCookieOptions(session.expiresAt));
  void purgeExpiredSessions(db).catch(() => {});
  return c.redirect(safeAdminNext(nextRaw));
});

admin.post("/logout", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) await destroySession(getDb(), sid);
  deleteCookie(c, SESSION_COOKIE, clearSessionCookieOptions());
  deleteCookie(c, CSRF_COOKIE, clearCsrfCookieOptions());
  return c.redirect("/admin/login");
});

admin.get("/", requireAdmin, async (c) => {
  const stats = await getDashboardStats(getDb());
  const html = renderToString(
    <AdminLayout title="Dashboard" user={c.get("adminUser")} path="/admin" csrfToken={c.get("csrfToken")}>
      <DashboardPage stats={stats} />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.get("/orders", requireAdmin, async (c) => {
  const status = (c.req.query("status") as "all" | OrderStatus) || "all";
  const fulfilled = (c.req.query("fulfilled") as "all" | "yes" | "no") || "all";
  const q = c.req.query("q") || "";
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const perPage = 20;
  const { rows, total } = await listOrders(getDb(), { status, fulfilled, q, page, perPage });
  const html = renderToString(
    <AdminLayout title="Orders" user={c.get("adminUser")} path="/admin/orders" csrfToken={c.get("csrfToken")}>
      <OrdersPage
        rows={rows}
        total={total}
        page={page}
        perPage={perPage}
        filters={{ status, fulfilled, q }}
      />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.get("/orders/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const order = await getOrderById(getDb(), id);
  if (!order) return c.notFound();
  const events = await listPaymentEventsForOrder(getDb(), id);
  const html = renderToString(
    <AdminLayout
      title={`Order ${id.slice(0, 8)}`}
      user={c.get("adminUser")}
      path="/admin/orders"
      csrfToken={c.get("csrfToken")}
    >
      <OrderDetailPage
        order={order}
        events={events}
        ok={c.req.query("ok")}
        error={c.req.query("error")}
        csrfToken={c.get("csrfToken")}
      />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.post("/orders/:id/fulfill", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  if (!rateLimitOk(clientIp(c), { windowMs: 60_000, max: 30, bucket: "admin-mutate" })) {
    return c.text("Too many requests", 429);
  }
  const id = c.req.param("id");
  const note = String(parsed.body.note ?? "").trim() || null;
  const user = c.get("adminUser");
  const order = await markFulfilled(getDb(), id, user.id, note);
  if (!order) return c.redirect(`/admin/orders/${id}?error=fulfill`);
  return c.redirect(`/admin/orders/${id}?ok=fulfilled`);
});

admin.post("/orders/:id/unfulfill", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  if (!rateLimitOk(clientIp(c), { windowMs: 60_000, max: 30, bucket: "admin-mutate" })) {
    return c.text("Too many requests", 429);
  }
  const id = c.req.param("id");
  await clearFulfilled(getDb(), id);
  return c.redirect(`/admin/orders/${id}?ok=unfulfilled`);
});

admin.post("/orders/:id/recheck", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  if (!rateLimitOk(clientIp(c), { windowMs: 60_000, max: 10, bucket: "admin-recheck" })) {
    return c.text("Too many requests", 429);
  }
  const id = c.req.param("id");
  const user = c.get("adminUser");
  const result = await recheckOrderPayment(getDb(), id, user.username);
  if (result.message === "not-found") return c.notFound();
  const q =
    result.message === "paid" || result.message === "already-paid"
      ? "ok=recheck"
      : `error=recheck`;
  return c.redirect(`/admin/orders/${id}?${q}`);
});

admin.get("/users", requireAdmin, async (c) => {
  const users = await listAdminUsers(getDb());
  const html = renderToString(
    <AdminLayout title="Users" user={c.get("adminUser")} path="/admin/users" csrfToken={c.get("csrfToken")}>
      <UsersPage
        users={users}
        currentUserId={c.get("adminUser").id}
        error={c.req.query("error")}
        ok={c.req.query("ok")}
        csrfToken={c.get("csrfToken")}
      />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.post("/users", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  if (!rateLimitOk(clientIp(c), { windowMs: 60_000, max: 10, bucket: "admin-users" })) {
    return c.text("Too many requests", 429);
  }
  const body = parsed.body;
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const discordId = String(body.discord_id ?? "").trim() || null;
  if (!username) return c.redirect("/admin/users?error=username-empty");
  const policy = validateAdminPassword(password, username);
  if (!policy.ok) {
    return c.redirect(
      `/admin/users?error=${policy.reason === "too-short" ? "password-short" : "password-weak"}`
    );
  }
  try {
    await createAdminUser(getDb(), { username, password, discordId });
    return c.redirect("/admin/users?ok=created");
  } catch {
    return c.redirect("/admin/users?error=create");
  }
});

admin.post("/users/:id/deactivate", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  const id = c.req.param("id");
  if (id === c.get("adminUser").id) {
    return c.redirect("/admin/users?error=cannot-self-deactivate");
  }
  if (await wouldDeactivateLastActiveAdmin(getDb(), id)) {
    return c.redirect("/admin/users?error=last-admin");
  }
  await setAdminActive(getDb(), id, false);
  await destroySessionsForUser(getDb(), id);
  return c.redirect("/admin/users?ok=deactivated");
});

admin.post("/users/:id/activate", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  const id = c.req.param("id");
  await setAdminActive(getDb(), id, true);
  return c.redirect("/admin/users?ok=activated");
});

admin.post("/users/:id/password", requireAdmin, async (c) => {
  const parsed = await parseAdminForm(c);
  if (!parsed.ok) return parsed.response;
  if (!rateLimitOk(clientIp(c), { windowMs: 60_000, max: 10, bucket: "admin-users" })) {
    return c.text("Too many requests", 429);
  }
  const id = c.req.param("id");
  const password = String(parsed.body.password ?? "");
  const policy = validateAdminPassword(password);
  if (!policy.ok) {
    return c.redirect(
      `/admin/users?error=${policy.reason === "too-short" ? "password-short" : "password-weak"}`
    );
  }
  try {
    await setAdminPassword(getDb(), id, password);
  } catch {
    return c.redirect("/admin/users?error=password-weak");
  }
  await destroySessionsForUser(getDb(), id);
  return c.redirect("/admin/users?ok=password");
});

export { admin as adminRoutes };
