import { test, expect } from "bun:test";
import {
  createOrderViewToken,
  verifyOrderViewToken,
  maskEmail,
} from "./order-view-token";
import { withEnv } from "./test-helpers";

test("createOrderViewToken is stable for same order id under same secret", async () => {
  await withEnv(
    { ORDER_VIEW_SECRET: "test-secret-abc", BAYAR_GG_API_KEY: undefined },
    async () => {
      const a = createOrderViewToken("ord-1");
      const b = createOrderViewToken("ord-1");
      expect(a).toBe(b);
      expect(a.length).toBeGreaterThan(20);
    }
  );
});

test("verifyOrderViewToken accepts valid token and rejects wrong/empty", async () => {
  await withEnv({ ORDER_VIEW_SECRET: "test-secret-abc" }, async () => {
    const tok = createOrderViewToken("ord-42");
    expect(verifyOrderViewToken("ord-42", tok)).toBe(true);
    expect(verifyOrderViewToken("ord-42", "deadbeef")).toBe(false);
    expect(verifyOrderViewToken("ord-42", "")).toBe(false);
    expect(verifyOrderViewToken("ord-42", undefined)).toBe(false);
    expect(verifyOrderViewToken("other", tok)).toBe(false);
  });
});

test("maskEmail hides local part", () => {
  expect(maskEmail("attacker@evil.test")).toBe("a***@evil.test");
  expect(maskEmail("ab@x.co")).toBe("a***@x.co");
  expect(maskEmail("not-an-email")).toBe("***");
});
