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
  get isHttps() {
    return this.baseUrl.startsWith("https://");
  },
};

export function isCheckoutConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!env.baseUrl) missing.push("PUBLIC_BASE_URL");
  if (!env.bayarApiKey) missing.push("BAYAR_GG_API_KEY");
  if (!env.discordWebhookUrl) missing.push("DISCORD_WEBHOOK_URL");
  if (!env.turnstileSiteKey) missing.push("TURNSTILE_SITE_KEY");
  if (!env.turnstileSecretKey) missing.push("TURNSTILE_SECRET_KEY");
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  return { ok: missing.length === 0, missing };
}
