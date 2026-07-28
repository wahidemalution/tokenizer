import { test, expect } from "bun:test";
import { getPlan, PLANS, PLAN_IDS, formatIdr, planMillions, pricePerMillion } from "./plans";

test("getPlan returns the 10m plan with correct amount", () => {
  const plan = getPlan("10m");
  expect(plan).not.toBeNull();
  expect(plan!.name).toBe("10M");
  expect(plan!.amountIdr).toBe(40000);
  expect(plan!.tokens).toBe("10M token");
  expect(plan!.duration).toBe("14 hari");
});

test("getPlan returns null for unknown id", () => {
  expect(getPlan("999m")).toBeNull();
  expect(getPlan("")).toBeNull();
});

test("PLANS has 6 entries with unique ids", () => {
  expect(PLANS).toHaveLength(6);
  const ids = PLANS.map((p) => p.id);
  expect(new Set(ids).size).toBe(6);
});

test("PLAN_IDS includes 1m and 100m", () => {
  expect(PLAN_IDS).toContain("1m");
  expect(PLAN_IDS).toContain("100m");
});

test("1m plan amount is 4000 and 100m is 300000", () => {
  expect(getPlan("1m")!.amountIdr).toBe(4000);
  expect(getPlan("100m")!.amountIdr).toBe(300000);
});

test("formatIdr formats with dot thousand separators", () => {
  expect(formatIdr(10000)).toBe("Rp10.000");
  expect(formatIdr(40000)).toBe("Rp40.000");
  expect(formatIdr(300000)).toBe("Rp300.000");
});

test("planMillions parses numeric prefix of plan name", () => {
  expect(planMillions(getPlan("1m")!)).toBe(1);
  expect(planMillions(getPlan("100m")!)).toBe(100);
});

test("pricePerMillion decreases on bigger plans", () => {
  expect(pricePerMillion(getPlan("1m")!)).toBe(4000);
  expect(pricePerMillion(getPlan("10m")!)).toBe(4000);
  expect(pricePerMillion(getPlan("50m")!)).toBe(3200);
  expect(pricePerMillion(getPlan("100m")!)).toBe(3000);
});
