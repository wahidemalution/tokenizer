import { and, eq, gt, lt } from "drizzle-orm";
import type { AppDb } from "../../db/client";
import { adminSessions, adminUsers } from "../../db/schema";
import type { AdminUserPublic } from "../admin-users";
import { env } from "../env";
import { adminBase } from "../admin-url";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

export async function createSession(
  db: AppDb,
  userId: string
): Promise<{ id: string; expiresAt: Date }> {
  const id = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({
    id,
    userId,
    expiresAt,
    createdAt: now,
  });
  return { id, expiresAt };
}

export async function getSessionUser(
  db: AppDb,
  sessionId: string | undefined
): Promise<AdminUserPublic | null> {
  if (!sessionId) return null;
  const now = new Date();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      user: adminUsers,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.id, sessionId), gt(adminSessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.user.isActive) return null;
  return toPublic(row.user);
}

export async function destroySession(db: AppDb, sessionId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
}

export async function destroySessionsForUser(db: AppDb, userId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}

/** Delete expired session rows (best-effort housekeeping). */
export async function purgeExpiredSessions(db: AppDb): Promise<number> {
  const result = await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, new Date()))
    .returning({ id: adminSessions.id });
  return result.length;
}

export function sessionCookieOptions(expiresAt: Date): {
  httpOnly: true;
  path: string;
  sameSite: "Strict";
  secure: boolean;
  expires: Date;
} {
  return {
    httpOnly: true,
    path: adminBase(),
    sameSite: "Strict",
    secure: env.isHttps,
    expires: expiresAt,
  };
}

export function clearSessionCookieOptions(): {
  httpOnly: true;
  path: string;
  sameSite: "Strict";
  secure: boolean;
} {
  return {
    httpOnly: true,
    path: adminBase(),
    sameSite: "Strict",
    secure: env.isHttps,
  };
}
