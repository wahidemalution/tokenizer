import type { AppDb } from "../db/client";
import { checkPayment } from "./bayar";
import {
  expireIfDue,
  getOrderById,
  isPaidAmountAcceptable,
  markPaid,
  type Order,
} from "./orders";
import { insertPaymentEvent } from "./payment-events";
import { sendPaidNotification } from "./discord";
import { setDiscordNotified } from "./orders";

export async function recheckOrderPayment(
  db: AppDb,
  orderId: string,
  actorUsername: string
): Promise<{ message: string; order: Order | null }> {
  let order = await getOrderById(db, orderId);
  if (!order) return { message: "not-found", order: null };
  if (!order.invoiceId) {
    await insertPaymentEvent(db, {
      orderId: order.id,
      source: "recheck",
      rawBody: { actor: actorUsername },
      processedOk: false,
      message: "no-invoice",
    });
    return { message: "no-invoice", order };
  }

  order = await expireIfDue(db, order);
  if (order.status === "expired") {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId: order.invoiceId,
      source: "recheck",
      rawBody: { actor: actorUsername },
      processedOk: false,
      message: "expired",
    });
    return { message: "expired", order };
  }

  if (order.status === "paid") {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId: order.invoiceId,
      source: "recheck",
      rawBody: { actor: actorUsername },
      processedOk: true,
      message: `already-paid:${actorUsername}`,
    });
    return { message: "already-paid", order };
  }

  let verified;
  try {
    verified = await checkPayment(order.invoiceId);
  } catch {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId: order.invoiceId,
      source: "recheck",
      rawBody: { actor: actorUsername },
      checkResult: null,
      processedOk: false,
      message: `verify-failed:${actorUsername}`,
    });
    return { message: "verify-failed", order };
  }

  if (!verified || verified.status !== "paid") {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId: order.invoiceId,
      source: "recheck",
      rawBody: { actor: actorUsername },
      checkResult: verified,
      processedOk: false,
      message: `not-paid:${actorUsername}`,
    });
    return { message: "not-paid", order };
  }

  if (!isPaidAmountAcceptable(order.amountIdr, verified.finalAmount)) {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId: order.invoiceId,
      source: "recheck",
      rawBody: { actor: actorUsername },
      checkResult: verified,
      processedOk: false,
      message: `amount-mismatch:${actorUsername}`,
    });
    return { message: "amount-mismatch", order };
  }

  const { order: paidOrder, transitioned } = await markPaid(
    db,
    order.id,
    verified.paidAt ?? new Date().toISOString(),
    verified.finalAmount ?? null
  );

  await insertPaymentEvent(db, {
    orderId: paidOrder.id,
    invoiceId: order.invoiceId,
    source: "recheck",
    rawBody: { actor: actorUsername },
    checkResult: verified,
    processedOk: true,
    message: `paid:${actorUsername}`,
  });

  if (transitioned || !paidOrder.discordNotified) {
    const discord = await sendPaidNotification(paidOrder);
    if (discord.ok) await setDiscordNotified(db, paidOrder.id);
  }

  return { message: "paid", order: paidOrder };
}
