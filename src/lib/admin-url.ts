import { env } from "./env";

export function adminBase(): string {
  const raw = (env.adminPath || "/admin").trim().replace(/\/+$/, "");
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  if (!/^\/[A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*$/.test(withSlash)) return "/admin";
  return withSlash;
}

export function adminUrl(path: string): string {
  const base = adminBase();
  if (!path) return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return base;
  return `${base}${p}`;
}

export function isAdminPath(path: string): boolean {
  const base = adminBase();
  return path === base || path.startsWith(`${base}/`);
}
