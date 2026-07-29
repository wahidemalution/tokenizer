import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getDb } from "../../db/client";
import type { AdminUserPublic } from "../admin-users";
import { getSessionUser, SESSION_COOKIE } from "./session";

export type AdminEnv = {
  Variables: {
    adminUser: AdminUserPublic;
  };
};

export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const db = getDb();
  const sid = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(db, sid);
  if (!user) {
    const nextUrl = encodeURIComponent(c.req.path.startsWith("/admin") ? c.req.path : `/admin${c.req.path}`);
    return c.redirect(`/admin/login?next=${nextUrl}`);
  }
  c.set("adminUser", user);
  await next();
});
