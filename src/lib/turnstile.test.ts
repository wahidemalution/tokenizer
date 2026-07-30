import { test, expect } from "bun:test";
import { verifyTurnstile } from "./turnstile";
import { withEnv, mockFetch } from "./test-helpers";

const GOOD = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

test("verifyTurnstile returns success when CF says success", async () => {
  globalThis.fetch = mockFetch({
    [GOOD]: { body: { success: true } },
  }) as any;
  await withEnv({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_BYPASS: undefined }, async () => {
    const r = await verifyTurnstile("tok");
    expect(r.success).toBe(true);
  });
});

test("verifyTurnstile fails when CF says failure", async () => {
  globalThis.fetch = mockFetch({
    [GOOD]: { body: { success: false, "error-codes": ["bad"] } },
  }) as any;
  await withEnv({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_BYPASS: undefined }, async () => {
    const r = await verifyTurnstile("tok");
    expect(r.success).toBe(false);
  });
});

test("verifyTurnstile bypasses when TURNSTILE_BYPASS=1", async () => {
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.resolve(new Response("{}"));
  }) as any;
  await withEnv({ TURNSTILE_BYPASS: "1", TURNSTILE_SECRET_KEY: "s" }, async () => {
    const r = await verifyTurnstile("");
    expect(r.success).toBe(true);
    expect(called).toBe(false);
  });
});

test("verifyTurnstile fails when token empty and no bypass", async () => {
  await withEnv({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_BYPASS: undefined }, async () => {
    const r = await verifyTurnstile("");
    expect(r.success).toBe(false);
  });
});
