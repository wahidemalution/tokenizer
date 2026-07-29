import { sql as dsql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "node:path";
import { createDb, type AppDb, type Sql } from "./client";

export function getTestDatabaseUrl(): string | null {
  return Bun.env.TEST_DATABASE_URL || Bun.env.DATABASE_URL || null;
}

export { createDb };

export async function closeSql(sql: Sql): Promise<void> {
  await sql.end({ timeout: 5 });
}

export async function truncateAll(db: AppDb): Promise<void> {
  await db.execute(
    dsql`TRUNCATE TABLE payment_events, admin_sessions, orders, admin_users RESTART IDENTITY CASCADE`
  );
}

export async function migrateTestDb(url: string): Promise<void> {
  const { db, sql } = createDb(url);
  try {
    const folder = join(import.meta.dir, "../../drizzle");
    await migrate(db, { migrationsFolder: folder });
  } finally {
    await closeSql(sql);
  }
}
