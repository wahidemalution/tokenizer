import { test, expect } from "bun:test";
import { isValidEmail, normalizePhone, normalizeEmail } from "./validate";

test("isValidEmail accepts standard emails", () => {
  expect(isValidEmail("user@example.com")).toBe(true);
  expect(isValidEmail("a.b+tag@sub.domain.co")).toBe(true);
});

test("isValidEmail rejects garbage", () => {
  expect(isValidEmail("")).toBe(false);
  expect(isValidEmail("notanemail")).toBe(false);
  expect(isValidEmail("a@")).toBe(false);
  expect(isValidEmail("@b.com")).toBe(false);
  expect(isValidEmail("a @b.com")).toBe(false);
});

test("normalizePhone converts 08 to 628", () => {
  expect(normalizePhone("08123456789")).toBe("628123456789");
});

test("normalizePhone keeps 62 prefix", () => {
  expect(normalizePhone("628123456789")).toBe("628123456789");
});

test("normalizePhone strips spaces and dashes", () => {
  expect(normalizePhone("0812-345 6789")).toBe("628123456789");
});

test("normalizePhone returns null for empty or non-digits", () => {
  expect(normalizePhone("")).toBeNull();
  expect(normalizePhone("abcdef")).toBeNull();
});

test("normalizeEmail trims and lowercases", () => {
  expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
  expect(normalizeEmail("user@Example.com")).toBe("user@example.com");
});
