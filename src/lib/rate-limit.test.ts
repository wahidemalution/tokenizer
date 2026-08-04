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

test("rate limiter evicts old buckets when the global bucket bound is reached", () => {
  const opts = { max: 1, windowMs: 60_000, bucket: "bounded-map-target" };
  expect(rateLimitOk("oldest", opts)).toBe(true);
  expect(rateLimitOk("oldest", opts)).toBe(false);

  for (let i = 0; i < 10_001; i++) {
    expect(
      rateLimitOk(`new-${i}`, { max: 1, windowMs: 60_000, bucket: "bounded-map-fill" })
    ).toBe(true);
  }

  // "oldest" was used recently (blocked) and must NOT be evicted just because
  // an attacker flooded unrelated buckets — otherwise the rate limit resets.
  expect(rateLimitOk("oldest", opts)).toBe(false);
});
