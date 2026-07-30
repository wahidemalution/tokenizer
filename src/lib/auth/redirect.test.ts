import { test, expect } from "bun:test";
import { safeAdminNext } from "./redirect";

test("safeAdminNext allows admin paths", () => {
  expect(safeAdminNext("/admin")).toBe("/admin");
  expect(safeAdminNext("/admin/orders")).toBe("/admin/orders");
  expect(safeAdminNext("/admin/orders/abc?ok=1")).toBe("/admin/orders/abc?ok=1");
});

test("safeAdminNext blocks open redirects", () => {
  expect(safeAdminNext("//evil.com")).toBe("/admin");
  expect(safeAdminNext("https://evil.com")).toBe("/admin");
  expect(safeAdminNext("/admin/../../../etc/passwd")).toBe("/admin");
  expect(safeAdminNext("/login")).toBe("/admin");
  expect(safeAdminNext("")).toBe("/admin");
  expect(safeAdminNext("/admin\\@evil.com")).toBe("/admin");
});
