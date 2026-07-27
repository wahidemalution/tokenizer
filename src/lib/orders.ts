import type { Database } from "./db";
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

const TTL_MS = 30 * 60 * 1000;
/** Surcharge kode unik maksimum di atas nominal order (gaya bayar.gg). */
const AMOUNT_UNIQUE_CODE_MAX = 999;

export function isPaidAmountAcceptable(
  orderAmountIdr: number,
  finalAmountIdr: number | null | undefined
): boolean {
  if (typeof finalAmountIdr !== "number" || !Number.isFinite(finalAmountIdr)) return false;
  if (finalAmountIdr < orderAmountIdr) return false;
  return finalAmountIdr <= orderAmountIdr + AMOUNT_UNIQUE_CODE_MAX;
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    planId: r.plan_id,
    planName: r.plan_name,
    tokens: r.tokens,
    amountIdr: r.amount_idr,
    finalAmountIdr: r.final_amount_idr,
    email: r.email,
    discordId: r.discord_id,
    whatsapp: r.whatsapp,
    telegram: r.telegram,
    status: r.status,
    paymentUrl: r.payment_url,
    paidAt: r.paid_at,
    expiresAt: r.expires_at,
    discordNotified: r.discord_notified === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createOrder(db: Database, input: NewOrderInput): Order {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  db.query(
    `INSERT INTO orders
      (id, invoice_id, plan_id, plan_name, tokens, amount_idr, email, discord_id, whatsapp, telegram, status, expires_at, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(
    input.id,
    input.plan.id,
    input.plan.name,
    input.plan.tokens,
    input.plan.amountIdr,
    input.email,
    input.discordId ?? null,
    input.whatsapp ?? null,
    input.telegram ?? null,
    expiresAt,
    now,
    now
  );
  return getOrderById(db, input.id)!;
}

export function getOrderById(db: Database, id: string): Order | null {
  const r = db.query(`SELECT * FROM orders WHERE id = ?`).get(id);
  return r ? rowToOrder(r) : null;
}

export function getOrderByInvoice(db: Database, invoiceId: string): Order | null {
  const r = db.query(`SELECT * FROM orders WHERE invoice_id = ?`).get(invoiceId);
  return r ? rowToOrder(r) : null;
}

export function findReusablePending(db: Database, email: string, planId: string): Order | null {
  const now = new Date().toISOString();
  const r = db
    .query(
      `SELECT * FROM orders
       WHERE email = ?
         AND plan_id = ?
         AND status = 'pending'
         AND expires_at > ?
         AND invoice_id IS NOT NULL
         AND payment_url IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(email, planId, now);
  return r ? rowToOrder(r) : null;
}

export function expireIfDue(db: Database, order: Order): Order {
  if (order.status !== "pending") return order;
  if (new Date(order.expiresAt).getTime() > Date.now()) return order;
  const now = new Date().toISOString();
  db.query(
    `UPDATE orders SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'pending'`
  ).run(now, order.id);
  return getOrderById(db, order.id)!;
}

export function markPaid(
  db: Database,
  id: string,
  paidAt: string,
  finalAmountIdr: number | null
): { order: Order; transitioned: boolean } {
  const now = new Date().toISOString();
  const result = db
    .query(
      `UPDATE orders SET status = 'paid', paid_at = ?, final_amount_idr = ?, updated_at = ? WHERE id = ? AND status = 'pending'`
    )
    .run(paidAt, finalAmountIdr, now, id);
  const order = getOrderById(db, id)!;
  return { order, transitioned: result.changes > 0 };
}

export function setInvoice(db: Database, id: string, invoiceId: string, paymentUrl: string): void {
  const now = new Date().toISOString();
  db.query(`UPDATE orders SET invoice_id = ?, payment_url = ?, updated_at = ? WHERE id = ?`).run(
    invoiceId,
    paymentUrl,
    now,
    id
  );
}

export function setDiscordNotified(db: Database, id: string): void {
  const now = new Date().toISOString();
  db.query(`UPDATE orders SET discord_notified = 1, updated_at = ? WHERE id = ?`).run(now, id);
}
