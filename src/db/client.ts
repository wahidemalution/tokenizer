import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../lib/env";

export type Sql = ReturnType<typeof postgres>;
export type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let _sql: Sql | null = null;
let _db: AppDb | null = null;

export function createDb(url: string): { db: AppDb; sql: Sql } {
  const sql = postgres(url, { max: 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export function getDb(): AppDb {
  if (_db) return _db;
  const url = env.databaseUrl || Bun.env.TEST_DATABASE_URL || "";
  if (!url) throw new Error("DATABASE_URL is required");
  const { db, sql } = createDb(url);
  _sql = sql;
  _db = db;
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}

export async function _resetDbForTests(url: string): Promise<AppDb> {
  await closeDb();
  const { db, sql } = createDb(url);
  _sql = sql;
  _db = db;
  return db;
}
