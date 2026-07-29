import { test, expect } from "bun:test";
import { getTestDatabaseUrl, createDb, closeSql } from "./test-utils";

const url = getTestDatabaseUrl();

test("createDb can select 1", async () => {
  if (!url) {
    console.warn("SKIP: set TEST_DATABASE_URL or DATABASE_URL for DB tests");
    return;
  }
  const { db, sql } = createDb(url);
  try {
    const rows = await db.execute("select 1 as n" as any);
    expect(rows).toBeDefined();
  } finally {
    await closeSql(sql);
  }
});
