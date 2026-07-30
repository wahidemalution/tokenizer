import { createMiddleware } from "hono/factory";
import { env } from "./env";

/** Baseline security headers for the whole app (admin + public). */
export const securityHeaders = createMiddleware(async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("X-DNS-Prefetch-Control", "off");
  // Admin is form/SSR only; public pages load fonts + Turnstile + client.js
  const path = c.req.path;
  if (path.startsWith("/admin")) {
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
      ].join("; ")
    );
  }
  if (env.isHttps) {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
});
