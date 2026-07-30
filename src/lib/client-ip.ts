import { env } from "./env";

/**
 * Client IP for rate limiting.
 * Only trusts CF-Connecting-IP / X-Forwarded-For when PUBLIC_BASE_URL is HTTPS
 * (assumes reverse proxy in production). Otherwise uses "direct" to avoid
 * client-spoofed header bypass of rate limits on bare local binds.
 */
export function clientIp(c: {
  req: { header: (n: string) => string | undefined };
}): string {
  if (env.isHttps) {
    const cf = c.req.header("CF-Connecting-IP")?.trim();
    if (cf) return cf;
    const xff = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (xff) return xff;
  }
  return c.req.header("x-real-ip")?.trim() || "direct";
}
