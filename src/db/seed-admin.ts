import type { AppDb } from "./client";
import { countAdminUsers, createAdminUser } from "../lib/admin-users";
import { env } from "../lib/env";
import { validateAdminPassword } from "../lib/auth/password-policy";

export async function seedAdminIfEmpty(db: AppDb): Promise<"seeded" | "skipped" | "rejected"> {
  const n = await countAdminUsers(db);
  if (n > 0) return "skipped";
  const username = env.adminUsername;
  const password = env.adminPassword;
  if (!username || !password) {
    console.warn("No admin users and ADMIN_USERNAME/ADMIN_PASSWORD not set — skip seed");
    return "skipped";
  }
  const policy = validateAdminPassword(password, username);
  if (!policy.ok) {
    console.error(
      `Refusing to seed admin: password policy failed (${policy.reason}). ` +
        `Set a strong ADMIN_PASSWORD (min 12 chars, not a known default).`
    );
    return "rejected";
  }
  await createAdminUser(db, { username, password });
  return "seeded";
}
