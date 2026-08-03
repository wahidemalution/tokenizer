import { test, expect } from "bun:test";
import { env, isCheckoutConfigured } from "./env";
import { withEnv } from "./test-helpers";

test("env.adminPath defaults to /admin", async () => {
  await withEnv({ ADMIN_PATH: undefined }, () => {
    expect(env.adminPath).toBe("/admin");
  });
});

test("env.adminPath reads ADMIN_PATH", async () => {
  await withEnv({ ADMIN_PATH: "/my-secret" }, () => {
    expect(env.adminPath).toBe("/my-secret");
  });
});

test("env reads BAYAR_GG_API_KEY", async () => {
  await withEnv({ BAYAR_GG_API_KEY: "key123" }, () => {
    expect(env.bayarApiKey).toBe("key123");
  });
});

test("env defaults bayarBaseUrl, paymentUrl, and method", async () => {
  await withEnv({ BAYAR_GG_API_KEY: "x", BAYAR_GG_BASE_URL: undefined }, () => {
    expect(env.bayarBaseUrl).toBe("https://www.bayar.gg/api");
    expect(env.bayarPaymentUrl).toBe("https://www.bayar.gg/pay");
    expect(env.bayarMethod).toBe("qris");
  });
});

test("isCheckoutConfigured lists missing keys", async () => {
  await withEnv(
    {
      PUBLIC_BASE_URL: undefined,
      BAYAR_GG_API_KEY: undefined,
      DISCORD_WEBHOOK_URL: undefined,
      TURNSTILE_SITE_KEY: undefined,
      TURNSTILE_SECRET_KEY: undefined,
      TURNSTILE_BYPASS: undefined,
      DATABASE_URL: undefined,
    },
    () => {
      const r = isCheckoutConfigured();
      expect(r.ok).toBe(false);
      expect(r.missing).toContain("PUBLIC_BASE_URL");
      expect(r.missing).toContain("BAYAR_GG_API_KEY");
      expect(r.missing).toContain("DISCORD_WEBHOOK_URL");
      expect(r.missing).toContain("TURNSTILE_SITE_KEY");
      expect(r.missing).toContain("DATABASE_URL");
    }
  );
});

test("isCheckoutConfigured ok when all set", async () => {
  await withEnv(
    {
      PUBLIC_BASE_URL: "https://x.test",
      BAYAR_GG_API_KEY: "k",
      DISCORD_WEBHOOK_URL: "https://discord.test",
      TURNSTILE_SITE_KEY: "site",
      TURNSTILE_SECRET_KEY: "secret",
      TURNSTILE_BYPASS: undefined,
      DATABASE_URL: "postgres://x",
    },
    () => {
      expect(isCheckoutConfigured().ok).toBe(true);
    }
  );
});

test("isCheckoutConfigured ok with TURNSTILE_BYPASS without turnstile keys", async () => {
  await withEnv(
    {
      PUBLIC_BASE_URL: "https://x.test",
      BAYAR_GG_API_KEY: "k",
      DISCORD_WEBHOOK_URL: "https://discord.test",
      TURNSTILE_SITE_KEY: undefined,
      TURNSTILE_SECRET_KEY: undefined,
      TURNSTILE_BYPASS: "1",
      DATABASE_URL: "postgres://x",
    },
    () => {
      expect(isCheckoutConfigured().ok).toBe(true);
      expect(isCheckoutConfigured().missing).toEqual([]);
    }
  );
});
