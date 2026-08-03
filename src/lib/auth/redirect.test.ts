import { test, expect } from "bun:test";
import { safeAdminNext } from "./redirect";
import { withEnv } from "../test-helpers";
import { adminBase } from "../admin-url";

test("safeAdminNext allows admin paths", async () => {
  await withEnv({ ADMIN_PATH: "/admin" }, () => {
    expect(safeAdminNext("/admin")).toBe("/admin");
    expect(safeAdminNext("/admin/orders")).toBe("/admin/orders");
    expect(safeAdminNext("/admin/orders/abc?ok=1")).toBe("/admin/orders/abc?ok=1");
  });
});

test("safeAdminNext blocks open redirects", async () => {
  await withEnv({ ADMIN_PATH: "/admin" }, () => {
    expect(safeAdminNext("//evil.com")).toBe("/admin");
    expect(safeAdminNext("https://evil.com")).toBe("/admin");
    expect(safeAdminNext("/admin/../../../etc/passwd")).toBe("/admin");
    expect(safeAdminNext("/login")).toBe("/admin");
    expect(safeAdminNext("")).toBe("/admin");
    expect(safeAdminNext("/admin\\@evil.com")).toBe("/admin");
  });
});

test("safeAdminNext uses the configured prefix", async () => {
  await withEnv({ ADMIN_PATH: "/my-secret" }, () => {
    expect(safeAdminNext("/my-secret")).toBe("/my-secret");
    expect(safeAdminNext("/my-secret/orders")).toBe("/my-secret/orders");
    expect(safeAdminNext("/admin")).toBe("/my-secret");
    expect(safeAdminNext("/my-secret/../../evil")).toBe("/my-secret");
  });
});

test("safeAdminNext follows the active ADMIN_PATH", () => {
  const base = adminBase();
  expect(safeAdminNext(base)).toBe(base);
  expect(safeAdminNext(`${base}/orders`)).toBe(`${base}/orders`);
});
