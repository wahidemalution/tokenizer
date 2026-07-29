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
} from "../lib/admin-users";
import { verifyPassword } from "../lib/auth/password";
import {
  createSession,
  destroySession,
  destroySessionsForUser,
  getSessionUser,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../lib/auth/session";
import { requireAdmin, type AdminEnv } from "../lib/auth/middleware";
import { rateLimitOk } from "../lib/rate-limit";
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

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

admin.get("/login", async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(getDb(), sid);
  if (user) return c.redirect("/admin");
  const error = c.req.query("error");
  const next = c.req.query("next") ?? undefined;
  const html = renderToString(<LoginPage error={error} next={next} />);
  return c.html(`<!doctype html>${html}`);
});

admin.post("/login", async (c) => {
  const ip = clientIp(c);
  if (!rateLimitOk(ip, { windowMs: 15 * 60_000, max: 10, bucket: "admin-login" })) {
    return c.redirect("/admin/login?error=rate");
  }
  const body = await c.req.parseBody();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const nextRaw = String(body.next ?? c.req.query("next") ?? "");
  const row = await findAdminByUsername(getDb(), username);
  if (!row || !row.isActive || !(await verifyPassword(password, row.passwordHash))) {
    return c.redirect("/admin/login?error=auth");
  }
  const session = await createSession(getDb(), row.id);
  setCookie(c, SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
  const dest =
    nextRaw.startsWith("/admin") && !nextRaw.startsWith("//") ? nextRaw : "/admin";
  return c.redirect(dest);
});

admin.post("/logout", requireAdmin, async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) await destroySession(getDb(), sid);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.redirect("/admin/login");
});

admin.get("/", requireAdmin, async (c) => {
  const stats = await getDashboardStats(getDb());
  const html = renderToString(
    <AdminLayout title="Dashboard" user={c.get("adminUser")} path="/admin">
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
    <AdminLayout title="Orders" user={c.get("adminUser")} path="/admin/orders">
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
    <AdminLayout title={`Order ${id.slice(0, 8)}`} user={c.get("adminUser")} path="/admin/orders">
      <OrderDetailPage
        order={order}
        events={events}
        ok={c.req.query("ok")}
        error={c.req.query("error")}
      />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.post("/orders/:id/fulfill", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const note = String(body.note ?? "").trim() || null;
  const user = c.get("adminUser");
  const order = await markFulfilled(getDb(), id, user.id, note);
  if (!order) return c.redirect(`/admin/orders/${id}?error=fulfill`);
  return c.redirect(`/admin/orders/${id}?ok=fulfilled`);
});

admin.post("/orders/:id/unfulfill", requireAdmin, async (c) => {
  const id = c.req.param("id");
  await clearFulfilled(getDb(), id);
  return c.redirect(`/admin/orders/${id}?ok=unfulfilled`);
});

admin.post("/orders/:id/recheck", requireAdmin, async (c) => {
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
    <AdminLayout title="Users" user={c.get("adminUser")} path="/admin/users">
      <UsersPage
        users={users}
        currentUserId={c.get("adminUser").id}
        error={c.req.query("error")}
        ok={c.req.query("ok")}
      />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});

admin.post("/users", requireAdmin, async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const discordId = String(body.discord_id ?? "").trim() || null;
  if (!username) return c.redirect("/admin/users?error=username-empty");
  if (password.length < 8) return c.redirect("/admin/users?error=password-short");
  try {
    await createAdminUser(getDb(), { username, password, discordId });
    return c.redirect("/admin/users?ok=created");
  } catch {
    return c.redirect("/admin/users?error=create");
  }
});

admin.post("/users/:id/deactivate", requireAdmin, async (c) => {
  const id = c.req.param("id");
  if (id === c.get("adminUser").id) {
    return c.redirect("/admin/users?error=cannot-self-deactivate");
  }
  await setAdminActive(getDb(), id, false);
  await destroySessionsForUser(getDb(), id);
  return c.redirect("/admin/users?ok=deactivated");
});

admin.post("/users/:id/activate", requireAdmin, async (c) => {
  const id = c.req.param("id");
  await setAdminActive(getDb(), id, true);
  return c.redirect("/admin/users?ok=activated");
});

admin.post("/users/:id/password", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const password = String(body.password ?? "");
  if (password.length < 8) return c.redirect("/admin/users?error=password-short");
  await setAdminPassword(getDb(), id, password);
  await destroySessionsForUser(getDb(), id);
  return c.redirect("/admin/users?ok=password");
});

export { admin as adminRoutes };
