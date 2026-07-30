import { test, expect } from "bun:test";
import { csrfTokensMatch, generateCsrfToken } from "./csrf";

test("generateCsrfToken is long and unique", () => {
  const a = generateCsrfToken();
  const b = generateCsrfToken();
  expect(a.length).toBeGreaterThanOrEqual(32);
  expect(a).not.toBe(b);
});

test("csrfTokensMatch accepts equal tokens", () => {
  const t = generateCsrfToken();
  expect(csrfTokensMatch(t, t)).toBe(true);
});

test("csrfTokensMatch rejects mismatch and empty", () => {
  expect(csrfTokensMatch("aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb")).toBe(false);
  expect(csrfTokensMatch(undefined, "x")).toBe(false);
  expect(csrfTokensMatch("x", undefined)).toBe(false);
  expect(csrfTokensMatch("", "")).toBe(false);
});
