import { count, eq } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { adminUsers } from "../db/schema";
import { hashPassword } from "./auth/password";
import { validateAdminPassword } from "./auth/password-policy";

export type AdminUserPublic = {
  id: string;
  username: string;
  role: string;
  discordId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminUserWithHash = AdminUserPublic & { passwordHash: string };

function toPublic(r: typeof adminUsers.$inferSelect): AdminUserPublic {
  return {
    id: r.id,
    username: r.username,
    role: r.role,
    discordId: r.discordId,
    isActive: r.isActive,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function createAdminUser(
  db: AppDb,
  input: { username: string; password: string; discordId?: string | null }
): Promise<AdminUserPublic> {
  const policy = validateAdminPassword(input.password, input.username);
  if (!policy.ok) {
    throw new Error(`password-policy:${policy.reason}`);
  }
  const now = new Date();
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  const rows = await db
    .insert(adminUsers)
    .values({
      id,
      username: input.username,
      passwordHash,
      role: "admin",
      discordId: input.discordId ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return toPublic(rows[0]);
}

export async function findAdminByUsername(
  db: AppDb,
  username: string
): Promise<AdminUserWithHash | null> {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return { ...toPublic(r), passwordHash: r.passwordHash };
}

export async function getAdminById(db: AppDb, id: string): Promise<AdminUserPublic | null> {
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return rows[0] ? toPublic(rows[0]) : null;
}

export async function listAdminUsers(db: AppDb): Promise<AdminUserPublic[]> {
  const rows = await db.select().from(adminUsers);
  return rows.map(toPublic);
}

export async function setAdminActive(db: AppDb, id: string, isActive: boolean): Promise<void> {
  await db
    .update(adminUsers)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(adminUsers.id, id));
}

export async function setAdminPassword(db: AppDb, id: string, password: string): Promise<void> {
  const existing = await getAdminById(db, id);
  const policy = validateAdminPassword(password, existing?.username);
  if (!policy.ok) {
    throw new Error(`password-policy:${policy.reason}`);
  }
  const passwordHash = await hashPassword(password);
  await db
    .update(adminUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(adminUsers.id, id));
}

export async function countAdminUsers(db: AppDb): Promise<number> {
  const [row] = await db.select({ n: count() }).from(adminUsers);
  return Number(row?.n ?? 0);
}

export async function countActiveAdminUsers(db: AppDb): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(eq(adminUsers.isActive, true));
  return Number(row?.n ?? 0);
}

/** True if deactivating this user would leave zero active admins. */
export async function wouldDeactivateLastActiveAdmin(
  db: AppDb,
  userId: string
): Promise<boolean> {
  const target = await getAdminById(db, userId);
  if (!target || !target.isActive) return false;
  const active = await countActiveAdminUsers(db);
  return active <= 1;
}
