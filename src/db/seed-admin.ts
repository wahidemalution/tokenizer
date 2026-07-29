import type { AppDb } from "./client";
import { countAdminUsers, createAdminUser } from "../lib/admin-users";
import { env } from "../lib/env";

export async function seedAdminIfEmpty(db: AppDb): Promise<"seeded" | "skipped"> {
  const n = await countAdminUsers(db);
  if (n > 0) return "skipped";
  const username = env.adminUsername;
  const password = env.adminPassword;
  if (!username || !password) {
    console.warn("No admin users and ADMIN_USERNAME/ADMIN_PASSWORD not set — skip seed");
    return "skipped";
  }
  await createAdminUser(db, { username, password });
  return "seeded";
}
