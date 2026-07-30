/**
 * Allow only same-origin relative admin paths.
 * Rejects protocol-relative, backslash, encoded tricks, and non-/admin targets.
 */
export function safeAdminNext(raw: string | undefined | null): string {
  if (!raw) return "/admin";
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return "/admin";
  }
  path = path.replace(/\\/g, "");
  if (!path.startsWith("/admin")) return "/admin";
  if (path.startsWith("//")) return "/admin";
  if (path.includes("://")) return "/admin";
  if (path.includes("@")) return "/admin";
  if (path.includes("..")) return "/admin";
  // Only path + optional query; no fragment abuse for open redirect
  if (!/^\/admin(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?(?:\?[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?$/.test(path)) {
    return "/admin";
  }
  return path;
}
