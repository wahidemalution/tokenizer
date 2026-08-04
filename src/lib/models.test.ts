import { test, expect } from "bun:test";
import {
  MODEL_STATUSES,
  MODEL_STATUS_META,
  isValidModelStatus,
  type ModelStatus,
} from "./models";

test("MODEL_STATUSES has the 4 expected values", () => {
  expect(MODEL_STATUSES).toEqual(["available", "maintenance", "error", "coming-soon"]);
});

test("MODEL_STATUS_META has a label and tone for every status", () => {
  for (const s of MODEL_STATUSES) {
    const meta = MODEL_STATUS_META[s as ModelStatus];
    expect(meta.label.length).toBeGreaterThan(0);
    expect(["neutral", "success", "warning", "danger"]).toContain(meta.tone);
  }
});

test("available maps to success tone", () => {
  expect(MODEL_STATUS_META.available.tone).toBe("success");
});

test("maintenance maps to warning tone", () => {
  expect(MODEL_STATUS_META.maintenance.tone).toBe("warning");
});

test("error maps to danger tone", () => {
  expect(MODEL_STATUS_META.error.tone).toBe("danger");
});

test("coming-soon maps to neutral tone", () => {
  expect(MODEL_STATUS_META["coming-soon"].tone).toBe("neutral");
});

test("isValidModelStatus accepts known statuses", () => {
  expect(isValidModelStatus("available")).toBe(true);
  expect(isValidModelStatus("maintenance")).toBe(true);
  expect(isValidModelStatus("error")).toBe(true);
  expect(isValidModelStatus("coming-soon")).toBe(true);
});

test("isValidModelStatus rejects unknown statuses", () => {
  expect(isValidModelStatus("bogus")).toBe(false);
  expect(isValidModelStatus("")).toBe(false);
  expect(isValidModelStatus("AVAILABLE")).toBe(false);
});
