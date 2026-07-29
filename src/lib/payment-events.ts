import { asc, eq } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { paymentEvents } from "../db/schema";

export type PaymentEventSource = "webhook" | "recheck" | "poll";

export type PaymentEvent = {
  id: string;
  orderId: string | null;
  invoiceId: string | null;
  source: PaymentEventSource;
  rawBody: unknown;
  checkResult: unknown | null;
  processedOk: boolean;
  message: string;
  createdAt: string;
};

export type NewPaymentEventInput = {
  id?: string;
  orderId?: string | null;
  invoiceId?: string | null;
  source: PaymentEventSource;
  rawBody: unknown;
  checkResult?: unknown | null;
  processedOk: boolean;
  message: string;
};

function rowToEvent(r: typeof paymentEvents.$inferSelect): PaymentEvent {
  return {
    id: r.id,
    orderId: r.orderId,
    invoiceId: r.invoiceId,
    source: r.source as PaymentEventSource,
    rawBody: r.rawBody,
    checkResult: r.checkResult,
    processedOk: r.processedOk,
    message: r.message,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function insertPaymentEvent(
  db: AppDb,
  input: NewPaymentEventInput
): Promise<PaymentEvent> {
  const id = input.id ?? crypto.randomUUID();
  const createdAt = new Date();
  const rows = await db
    .insert(paymentEvents)
    .values({
      id,
      orderId: input.orderId ?? null,
      invoiceId: input.invoiceId ?? null,
      source: input.source,
      rawBody: input.rawBody as any,
      checkResult: (input.checkResult ?? null) as any,
      processedOk: input.processedOk,
      message: input.message,
      createdAt,
    })
    .returning();
  return rowToEvent(rows[0]);
}

export async function listPaymentEventsForOrder(
  db: AppDb,
  orderId: string
): Promise<PaymentEvent[]> {
  const rows = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.orderId, orderId))
    .orderBy(asc(paymentEvents.createdAt));
  return rows.map(rowToEvent);
}
