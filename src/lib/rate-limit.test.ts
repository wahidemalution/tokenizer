import { test, expect } from "bun:test";
import { rateLimitOk } from "./rate-limit";

test("rateLimitOk allows up to 5 per minute then blocks", () => {
  const ip = "10.1.0.1";
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(false);
});

test("rateLimitOk tracks empty ip under unknown bucket and eventually blocks", () => {
  for (let i = 0; i < 5; i++) {
    expect(rateLimitOk("")).toBe(true);
  }
  expect(rateLimitOk("")).toBe(false);
});

test("rateLimitOk tracks separate IPs independently", () => {
  expect(rateLimitOk("10.1.0.2")).toBe(true);
  expect(rateLimitOk("10.1.0.1")).toBe(false);
});
