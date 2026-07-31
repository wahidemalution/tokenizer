import { and, count, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql, sum } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { orders } from "../db/schema";
import type { Plan } from "./plans";

export type OrderStatus = "pending" | "paid" | "expired";

export type Order = {
  id: string;
  invoiceId: string | null;
  planId: string;
  planName: string;
  tokens: string;
  amountIdr: number;
  finalAmountIdr: number | null;
  email: string;
  discordId: string | null;
  whatsapp: string | null;
  telegram: string | null;
  status: OrderStatus;
  paymentUrl: string | null;
  paidAt: string | null;
  expiresAt: string;
  discordNotified: boolean;
  fulfilledAt: string | null;
  fulfillmentNote: string | null;
  fulfilledBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewOrderInput = {
  id: string;
  plan: Plan;
  email: string;
  discordId?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
};

const AMOUNT_UNIQUE_CODE_MAX = 0; // removed tolerance logic - bayar.gg no longer supports unique_code

export function isPaidAmountAcceptable(
  orderAmountIdr: number,
  finalAmountIdr: number | null | undefined
): boolean {
  if (typeof finalAmountIdr !== "number" || !Number.isFinite(finalAmountIdr)) return false;
  if (finalAmountIdr < orderAmountIdr) return false;
  return finalAmountIdr <= orderAmountIdr + AMOUNT_UNIQUE_CODE_MAX;
}

function toIso(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString();
  return new Date(d).toISOString();
}

function rowToOrder(r: typeof orders.$inferSelect): Order {
  return {
    id: r.id,
    invoiceId: r.invoiceId,
    planId: r.planId,
    planName: r.planName,
    tokens: r.tokens,
    amountIdr: r.amountIdr,
    finalAmountIdr: r.finalAmountIdr,
    email: r.email,
    discordId: r.discordId,
    whatsapp: r.whatsapp,
    telegram: r.telegram,
    status: r.status as OrderStatus,
    paymentUrl: r.paymentUrl,
    paidAt: toIso(r.paidAt),
    expiresAt: toIso(r.expiresAt)!,
    discordNotified: r.discordNotified,
    fulfilledAt: toIso(r.fulfilledAt),
    fulfillmentNote: r.fulfillmentNote,
    fulfilledBy: r.fulfilledBy,
    createdAt: toIso(r.createdAt)!,
    updatedAt: toIso(r.updatedAt)!,
  };
}

export async function createOrder(db: AppDb, input: NewOrderInput): Promise<Order> {
  const now = new Date();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(orders).values({
    id: input.id,
    invoiceId: null,
    planId: input.plan.id,
    planName: input.plan.name,
    tokens: input.plan.tokens,
    amountIdr: input.plan.amountIdr,
    email: input.email,
    discordId: input.discordId ?? null,
    whatsapp: input.whatsapp ?? null,
    telegram: input.telegram ?? null,
    status: "pending",
    expiresAt,
    discordNotified: false,
    createdAt: now,
    updatedAt: now,
  });
  return (await getOrderById(db, input.id))!;
}

export async function getOrderById(db: AppDb, id: string): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function getOrderByInvoice(db: AppDb, invoiceId: string): Promise<Order | null> {
  const rows = await db.select().from(orders).where(eq(orders.invoiceId, invoiceId)).limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function findReusablePending(
  db: AppDb,
  email: string,
  planId: string
): Promise<Order | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.email, email),
        eq(orders.planId, planId),
        eq(orders.status, "pending"),
        gte(orders.expiresAt, now),
        isNotNull(orders.invoiceId),
        isNotNull(orders.paymentUrl)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function expireIfDue(db: AppDb, order: Order): Promise<Order> {
  if (order.status !== "pending") return order;
  if (new Date(order.expiresAt).getTime() > Date.now()) return order;
  const now = new Date();
  await db
    .update(orders)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
  return (await getOrderById(db, order.id))!;
}

export async function markPaid(
  db: AppDb,
  id: string,
  paidAt: string,
  finalAmountIdr: number | null
): Promise<{ order: Order; transitioned: boolean }> {
  const now = new Date();
  const updated = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(paidAt),
      finalAmountIdr,
      updatedAt: now,
    })
    .where(and(eq(orders.id, id), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  const order = (await getOrderById(db, id))!;
  return { order, transitioned: updated.length > 0 };
}

export async function setInvoice(
  db: AppDb,
  id: string,
  invoiceId: string,
  paymentUrl: string
): Promise<void> {
  const now = new Date();
  await db
    .update(orders)
    .set({ invoiceId, paymentUrl, updatedAt: now })
    .where(eq(orders.id, id));
}

export async function setDiscordNotified(db: AppDb, id: string): Promise<void> {
  const now = new Date();
  await db
    .update(orders)
    .set({ discordNotified: true, updatedAt: now })
    .where(eq(orders.id, id));
}

/** Test/helper: force expires_at (ISO). */
export async function setExpiresAt(db: AppDb, id: string, expiresAt: string): Promise<void> {
  await db
    .update(orders)
    .set({ expiresAt: new Date(expiresAt), updatedAt: new Date() })
    .where(eq(orders.id, id));
}

/** Test/helper: force created_at. */
export async function setCreatedAt(db: AppDb, id: string, createdAt: string): Promise<void> {
  await db
    .update(orders)
    .set({ createdAt: new Date(createdAt), updatedAt: new Date() })
    .where(eq(orders.id, id));
}

export async function markFulfilled(
  db: AppDb,
  id: string,
  adminUserId: string,
  note: string | null
): Promise<Order | null> {
  const now = new Date();
  const updated = await db
    .update(orders)
    .set({
      fulfilledAt: now,
      fulfillmentNote: note,
      fulfilledBy: adminUserId,
      updatedAt: now,
    })
    .where(and(eq(orders.id, id), eq(orders.status, "paid")))
    .returning({ id: orders.id });
  if (updated.length === 0) return null;
  return getOrderById(db, id);
}

export async function clearFulfilled(db: AppDb, id: string): Promise<Order | null> {
  const now = new Date();
  await db
    .update(orders)
    .set({
      fulfilledAt: null,
      fulfillmentNote: null,
      fulfilledBy: null,
      updatedAt: now,
    })
    .where(eq(orders.id, id));
  return getOrderById(db, id);
}

export type OrderListFilters = {
  status?: "all" | OrderStatus;
  fulfilled?: "all" | "yes" | "no";
  q?: string;
  page?: number;
  perPage?: number;
};

export async function listOrders(
  db: AppDb,
  filters: OrderListFilters
): Promise<{ rows: Order[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));
  const offset = (page - 1) * perPage;

  const conditions = [];
  if (filters.status && filters.status !== "all") {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters.fulfilled === "yes") {
    conditions.push(isNotNull(orders.fulfilledAt));
  } else if (filters.fulfilled === "no") {
    conditions.push(isNull(orders.fulfilledAt));
  }
  if (filters.q && filters.q.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(ilike(orders.email, q), ilike(orders.invoiceId, q), ilike(orders.id, q))!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db.select({ total: count() }).from(orders).where(where);
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(perPage)
    .offset(offset);

  return { rows: rows.map(rowToOrder), total: Number(countRow?.total ?? 0) };
}

export type DashboardStats = {
  pending: number;
  expired: number;
  paidToday: number;
  revenueTodayIdr: number;
  unfulfilledPaid: number;
};

export function jakartaDayRange(now = new Date()): { start: Date; end: Date } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = fmt.format(now);
  const start = new Date(`${day}T00:00:00+07:00`);
  const end = new Date(`${day}T23:59:59.999+07:00`);
  return { start, end };
}

export async function getDashboardStats(db: AppDb, now = new Date()): Promise<DashboardStats> {
  const { start, end } = jakartaDayRange(now);

  const [pendingRow] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, "pending"));
  const [expiredRow] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, "expired"));
  const [unfulfilledRow] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.status, "paid"), isNull(orders.fulfilledAt)));

  const paidTodayRows = await db
    .select({
      n: count(),
      revenue: sum(sql`coalesce(${orders.finalAmountIdr}, ${orders.amountIdr})`),
    })
    .from(orders)
    .where(
      and(eq(orders.status, "paid"), gte(orders.paidAt, start), lte(orders.paidAt, end))
    );

  return {
    pending: Number(pendingRow?.n ?? 0),
    expired: Number(expiredRow?.n ?? 0),
    paidToday: Number(paidTodayRows[0]?.n ?? 0),
    revenueTodayIdr: Number(paidTodayRows[0]?.revenue ?? 0),
    unfulfilledPaid: Number(unfulfilledRow?.n ?? 0),
  };
}
