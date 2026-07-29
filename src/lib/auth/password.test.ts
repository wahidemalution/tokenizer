import { test, expect } from "bun:test";
import { hashPassword, verifyPassword } from "./password";

test("hash and verify argon2id", async () => {
  const h = await hashPassword("secret-pass");
  expect(h.startsWith("$argon2id$")).toBe(true);
  expect(await verifyPassword("secret-pass", h)).toBe(true);
  expect(await verifyPassword("wrong", h)).toBe(false);
});
