import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import {
  getTestDatabaseUrl,
  migrateTestDb,
  truncateAll,
  createDb,
  closeSql,
} from "../../db/test-utils";
import type { AppDb, Sql } from "../../db/client";
import { createAdminUser, setAdminActive } from "../admin-users";
import { createSession, destroySession, destroySessionsForUser, getSessionUser } from "./session";
import { seedAdminIfEmpty } from "../../db/seed-admin";

const url = getTestDatabaseUrl();
let db: AppDb;
let sql: Sql;

function skip(): boolean {
  if (!url) {
    console.warn("SKIP session tests: no DB URL");
    return true;
  }
  return false;
}

beforeAll(async () => {
  if (!url) return;
  await migrateTestDb(url);
  const c = createDb(url);
  db = c.db;
  sql = c.sql;
});

beforeEach(async () => {
  if (!url) return;
  await truncateAll(db);
});

afterAll(async () => {
  if (sql) await closeSql(sql);
});

test("createSession and getSessionUser", async () => {
  if (skip()) return;
  const u = await createAdminUser(db, { username: "ops", password: "pass-long-1" });
  const s = await createSession(db, u.id);
  const got = await getSessionUser(db, s.id);
  expect(got?.username).toBe("ops");
  await destroySession(db, s.id);
  expect(await getSessionUser(db, s.id)).toBeNull();
});

test("deactivate clears sessions", async () => {
  if (skip()) return;
  const u = await createAdminUser(db, { username: "x", password: "pass-long-1" });
  const s = await createSession(db, u.id);
  await setAdminActive(db, u.id, false);
  await destroySessionsForUser(db, u.id);
  expect(await getSessionUser(db, s.id)).toBeNull();
});

test("seedAdminIfEmpty seeds once", async () => {
  if (skip()) return;
  Bun.env.ADMIN_USERNAME = "seedadmin";
  Bun.env.ADMIN_PASSWORD = "seed-pass-strong";
  expect(await seedAdminIfEmpty(db)).toBe("seeded");
  expect(await seedAdminIfEmpty(db)).toBe("skipped");
});
