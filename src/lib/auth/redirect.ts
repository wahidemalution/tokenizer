import { adminBase } from "../admin-url";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Allow only same-origin relative admin paths.
 * Rejects protocol-relative, backslash, encoded tricks, and non-admin targets.
 */
export function safeAdminNext(raw: string | undefined | null): string {
  const base = adminBase();
  if (!raw) return base;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return base;
  }
  path = path.replace(/\\/g, "");
  if (!path.startsWith(base)) return base;
  if (path.startsWith("//")) return base;
  if (path.includes("://")) return base;
  if (path.includes("@")) return base;
  if (path.includes("..")) return base;
  const rest = path.slice(base.length);
  if (!/^(?:[A-Za-z0-9._~!$&'()*+,;=:@%/-]|\?[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)*$/.test(rest)) {
    return base;
  }
  return path;
}