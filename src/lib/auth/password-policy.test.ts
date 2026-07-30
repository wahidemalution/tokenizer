import { test, expect } from "bun:test";
import { validateAdminPassword, MIN_ADMIN_PASSWORD_LENGTH } from "./password-policy";

test("rejects short and blocked passwords", () => {
  expect(validateAdminPassword("short").ok).toBe(false);
  expect(validateAdminPassword("change-me-strong").ok).toBe(false);
  expect(validateAdminPassword("password123").ok).toBe(false);
  expect(validateAdminPassword("adminadminadmin", "adminadminadmin").ok).toBe(false);
});

test("accepts strong password", () => {
  const r = validateAdminPassword("x".repeat(MIN_ADMIN_PASSWORD_LENGTH) + "-ok");
  expect(r.ok).toBe(true);
});
