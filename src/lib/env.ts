function get(key: string): string {
  return Bun.env[key] ?? "";
}

export const env = {
  get baseUrl() {
    return get("PUBLIC_BASE_URL").replace(/\/$/, "");
  },
  get bayarApiKey() {
    return get("BAYAR_GG_API_KEY");
  },
  get bayarBaseUrl() {
    return get("BAYAR_GG_BASE_URL") || "https://www.bayar.gg/api";
  },
  get bayarPaymentUrl() {
    return get("BAYAR_GG_PAYMENT_URL") || "https://www.bayar.gg/pay";
  },
  get bayarMethod() {
    return get("BAYAR_GG_PAYMENT_METHOD") || "qris";
  },
  get discordWebhookUrl() {
    return get("DISCORD_WEBHOOK_URL");
  },
  get turnstileSiteKey() {
    return get("TURNSTILE_SITE_KEY");
  },
  get turnstileSecretKey() {
    return get("TURNSTILE_SECRET_KEY");
  },
  get turnstileBypass() {
    return get("TURNSTILE_BYPASS") === "1";
  },
  get databaseUrl() {
    return get("DATABASE_URL");
  },
  get adminUsername() {
    return get("ADMIN_USERNAME");
  },
  get adminPassword() {
    return get("ADMIN_PASSWORD");
  },
  get adminPath() {
    return get("ADMIN_PATH") || "/admin";
  },
  get orderViewSecret() {
    return get("ORDER_VIEW_SECRET");
  },
  get trustProxy() {
    return get("TRUST_PROXY") === "1";
  },
  get isHttps() {
    return this.baseUrl.startsWith("https://");
  },
};

export function isCheckoutConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!env.baseUrl) missing.push("PUBLIC_BASE_URL");
  if (!env.bayarApiKey) missing.push("BAYAR_GG_API_KEY");
  if (!env.discordWebhookUrl) missing.push("DISCORD_WEBHOOK_URL");
  // TURNSTILE_BYPASS=1: skip captcha keys (dev only). Production must set both keys.
  if (!env.turnstileBypass) {
    if (!env.turnstileSiteKey) missing.push("TURNSTILE_SITE_KEY");
    if (!env.turnstileSecretKey) missing.push("TURNSTILE_SECRET_KEY");
  }
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  return { ok: missing.length === 0, missing };
}

const BLOCKED_ORDER_VIEW_SECRETS = new Set([
  "replace-with-long-random-secret",
  "dev-only-order-view-secret",
  "order-view-secret",
  "secret",
  "change-me",
  "changeme",
]);

function isValidOrderViewSecret(secret: string): boolean {
  const trimmed = secret.trim();
  if (trimmed.length < 16) return false;
  if (BLOCKED_ORDER_VIEW_SECRETS.has(trimmed.toLowerCase())) return false;
  return true;
}

export function validateRuntimeEnv(): string[] {
  if (!isValidOrderViewSecret(env.orderViewSecret)) {
    throw new Error(
      "ORDER_VIEW_SECRET is required (min 16 chars, not a placeholder). Generate with: openssl rand -base64 48"
    );
  }
  const isProd = get("NODE_ENV") === "production";
  const isLocalhostOrigin =
    /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(env.baseUrl);
  if (isProd && !env.isHttps && !isLocalhostOrigin) {
    throw new Error("PUBLIC_BASE_URL must use HTTPS in production");
  }
  return [];
}
