import { env } from "./env";

/**
 * Client IP for rate limiting.
 *
 * Forwarding headers are attacker-controlled unless a reverse proxy overwrites
 * them, so ALL of them (CF-Connecting-IP, X-Forwarded-For, X-Real-IP) are only
 * trusted when TRUST_PROXY=1 explicitly declares a trusted reverse proxy.
 * Otherwise every request collapses to the "direct" bucket — a shared limit is
 * strictly safer than one an attacker can shard by rotating a header value.
 */
export function clientIp(c: {
  req: { header: (n: string) => string | undefined };
}): string {
  if (!env.trustProxy) return "direct";
  const cf = c.req.header("CF-Connecting-IP")?.trim();
  if (cf) return cf;
  const xff = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return xff;
  return c.req.header("x-real-ip")?.trim() || "direct";
}
