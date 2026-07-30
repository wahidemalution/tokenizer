import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

function viewSecret(): string {
  const dedicated = env.orderViewSecret;
  if (dedicated) return dedicated;
  const bayar = env.bayarApiKey;
  if (bayar) return `bayar:${bayar}`;
  const db = env.databaseUrl;
  if (db) return `db:${db}`;
  return "dev-only-order-view-secret";
}

export function createOrderViewToken(orderId: string): string {
  return createHmac("sha256", viewSecret()).update(orderId, "utf8").digest("base64url");
}

export function verifyOrderViewToken(orderId: string, token: string | undefined | null): boolean {
  if (!orderId || !token) return false;
  const expected = createOrderViewToken(orderId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(1, local.length));
  return `${head}***@${domain}`;
}
