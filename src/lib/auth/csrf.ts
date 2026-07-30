import { timingSafeEqual } from "crypto";
import { env } from "../env";

export const CSRF_COOKIE = "admin_csrf";
export const CSRF_FIELD = "_csrf";

export function generateCsrfToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

export function csrfCookieOptions(expiresAt: Date): {
  httpOnly: true;
  path: string;
  sameSite: "Strict";
  secure: boolean;
  expires: Date;
} {
  return {
    httpOnly: true,
    path: "/admin",
    sameSite: "Strict",
    secure: env.isHttps,
    expires: expiresAt,
  };
}

export function clearCsrfCookieOptions(): {
  httpOnly: true;
  path: string;
  sameSite: "Strict";
  secure: boolean;
} {
  return {
    httpOnly: true,
    path: "/admin",
    sameSite: "Strict",
    secure: env.isHttps,
  };
}

/** Constant-time compare for equal-length tokens; false if lengths differ. */
export function csrfTokensMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
