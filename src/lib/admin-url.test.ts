import { test, expect } from "bun:test";
import { adminBase, adminUrl, isAdminPath } from "./admin-url";
import { withEnv } from "./test-helpers";

test("adminBase defaults to /admin", async () => {
  await withEnv({ ADMIN_PATH: undefined }, () => {
    expect(adminBase()).toBe("/admin");
  });
});

test("adminBase normalizes custom paths", async () => {
  await withEnv({ ADMIN_PATH: "/my-secret/" }, () => {
    expect(adminBase()).toBe("/my-secret");
  });
  await withEnv({ ADMIN_PATH: "no-slash" }, () => {
    expect(adminBase()).toBe("/no-slash");
  });
  await withEnv({ ADMIN_PATH: "/secret/nested/panel" }, () => {
    expect(adminBase()).toBe("/secret/nested/panel");
  });
});

test("adminBase falls back to /admin on invalid input", async () => {
  await withEnv({ ADMIN_PATH: "/has space" }, () => {
    expect(adminBase()).toBe("/admin");
  });
  await withEnv({ ADMIN_PATH: "/bad;chars" }, () => {
    expect(adminBase()).toBe("/admin");
  });
});

test("adminUrl builds prefixed paths", async () => {
  await withEnv({ ADMIN_PATH: "/my-secret" }, () => {
    expect(adminUrl("")).toBe("/my-secret");
    expect(adminUrl("/")).toBe("/my-secret");
    expect(adminUrl("/login")).toBe("/my-secret/login");
    expect(adminUrl("/orders/abc")).toBe("/my-secret/orders/abc");
  });
});

test("isAdminPath matches only the configured prefix", async () => {
  await withEnv({ ADMIN_PATH: "/my-secret" }, () => {
    expect(isAdminPath("/my-secret")).toBe(true);
    expect(isAdminPath("/my-secret/orders")).toBe(true);
    expect(isAdminPath("/admin")).toBe(false);
    expect(isAdminPath("/my-secretary")).toBe(false);
  });
});
