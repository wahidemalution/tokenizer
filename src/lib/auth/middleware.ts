import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { getDb } from "../../db/client";
import type { AdminUserPublic } from "../admin-users";
import {
  CSRF_COOKIE,
  CSRF_FIELD,
  csrfCookieOptions,
  csrfTokensMatch,
  generateCsrfToken,
} from "./csrf";
import { getSessionUser, SESSION_COOKIE, SESSION_TTL_MS } from "./session";
import { safeAdminNext } from "./redirect";
import { adminBase, adminUrl, isAdminPath } from "../admin-url";

export type AdminEnv = {
  Variables: {
    adminUser: AdminUserPublic;
    csrfToken: string;
  };
};

export function ensureCsrfCookie(c: Context): string {
  const existing = getCookie(c, CSRF_COOKIE);
  if (existing && existing.length >= 16) return existing;
  const token = generateCsrfToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  setCookie(c, CSRF_COOKIE, token, csrfCookieOptions(expiresAt));
  return token;
}

export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const db = getDb();
  const sid = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(db, sid);
  if (!user) {
    const rawPath = isAdminPath(c.req.path) ? c.req.path : adminUrl(c.req.path);
    const nextUrl = encodeURIComponent(safeAdminNext(rawPath));
    return c.redirect(`${adminUrl("/login")}?next=${nextUrl}`);
  }
  const csrfToken = ensureCsrfCookie(c);
  c.set("adminUser", user);
  c.set("csrfToken", csrfToken);
  await next();
});

/**
 * Parse form body and enforce double-submit CSRF (cookie + hidden field).
 * Returns null body with 403 response when invalid.
 */
export async function parseAdminForm(
  c: Context<AdminEnv>
): Promise<
  | { ok: true; body: Record<string, string | File> }
  | { ok: false; response: Response }
> {
  const body = (await c.req.parseBody()) as Record<string, string | File>;
  const cookieToken = getCookie(c, CSRF_COOKIE);
  const formToken = String(body[CSRF_FIELD] ?? "");
  if (!csrfTokensMatch(cookieToken, formToken)) {
    return { ok: false, response: c.text("Invalid CSRF token", 403) };
  }
  return { ok: true, body };
}
