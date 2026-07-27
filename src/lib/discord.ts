import { env } from "./env";
import type { Order } from "./orders";

export function buildPaidEmbed(order: Order): unknown {
  const fields: { name: string; value: string }[] = [
    { name: "Plan", value: `${order.planName} (${order.tokens})` },
    { name: "Email", value: order.email },
    { name: "Harga", value: `Rp${order.finalAmountIdr ?? order.amountIdr}` },
    { name: "Invoice", value: order.invoiceId ?? "-" },
  ];
  if (order.discordId) fields.push({ name: "Discord", value: order.discordId });
  if (order.whatsapp) fields.push({ name: "WhatsApp", value: order.whatsapp });
  if (order.telegram) fields.push({ name: "Telegram", value: order.telegram });
  fields.push({ name: "Order ID", value: order.id });
  if (order.paidAt) fields.push({ name: "Paid at", value: order.paidAt });

  return {
    username: "Tokenizer Orders",
    embeds: [
      {
        title: `Payment received — Tokenizer ${order.planName}`,
        color: 0x3ecf8e,
        fields,
        footer: { text: `Tokenizer • ${order.id}` },
        timestamp: order.paidAt ?? new Date().toISOString(),
      },
    ],
  };
}

export async function sendPaidNotification(
  order: Order
): Promise<{ ok: boolean; error?: string }> {
  if (!env.discordWebhookUrl) return { ok: false, error: "webhook-not-configured" };
  try {
    const res = await fetch(env.discordWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPaidEmbed(order)),
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `discord-${res.status}:${text.slice(0, 120)}` };
  } catch (e: any) {
    return { ok: false, error: `discord-unreachable:${e?.message ?? e}` };
  }
}
