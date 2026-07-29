import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "node:path";
import { createDb } from "./client";

const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const { db, sql } = createDb(url);
try {
  const folder = join(import.meta.dir, "../../drizzle");
  await migrate(db, { migrationsFolder: folder });
  console.log("Migrations applied");
} finally {
  await sql.end({ timeout: 5 });
}
