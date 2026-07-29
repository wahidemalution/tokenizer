import type { FC } from "hono/jsx";
import type { Order } from "../../lib/orders";
import type { PaymentEvent } from "../../lib/payment-events";
import { formatIdr } from "../../lib/plans";

export const OrderDetailPage: FC<{
  order: Order;
  events: PaymentEvent[];
  ok?: string | null;
  error?: string | null;
}> = ({ order, events, ok, error }) => {
  const flash =
    ok === "fulfilled"
      ? "Order ditandai fulfilled."
      : ok === "unfulfilled"
        ? "Fulfillment dibatalkan."
        : ok === "recheck"
          ? "Recheck selesai."
          : null;
  const errText =
    error === "fulfill"
      ? "Gagal fulfill (hanya order paid)."
      : error === "recheck"
        ? "Recheck gagal."
        : error ?? null;

  return (
    <div>
      {(flash || errText) && null}
      {flash ? (
        <div class="mb-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
          {flash}
        </div>
      ) : null}
      {errText ? (
        <div class="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errText}
        </div>
      ) : null}

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a href="/admin/orders" class="text-sm text-muted hover:text-foreground">
            ← Orders
          </a>
          <h1 class="mt-2 text-xl font-semibold">Order detail</h1>
          <p class="font-mono text-xs text-muted">{order.id}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          {order.invoiceId ? (
            <form method="post" action={`/admin/orders/${order.id}/recheck`}>
              <button
                type="submit"
                class="rounded-md border border-border bg-elevated px-3 py-1.5 text-sm"
              >
                Re-check bayar.gg
              </button>
            </form>
          ) : null}
          {order.status === "paid" && !order.fulfilledAt ? (
            <span class="text-xs text-muted self-center">Belum fulfilled</span>
          ) : null}
        </div>
      </div>

      <dl class="mt-6 grid gap-3 sm:grid-cols-2 rounded-md border border-border bg-panel p-4 text-sm">
        {[
          ["Status", order.status],
          ["Plan", `${order.planName} (${order.tokens})`],
          ["Amount", formatIdr(order.amountIdr)],
          ["Final amount", order.finalAmountIdr != null ? formatIdr(order.finalAmountIdr) : "—"],
          ["Email", order.email],
          ["Discord", order.discordId ?? "—"],
          ["WhatsApp", order.whatsapp ?? "—"],
          ["Telegram", order.telegram ?? "—"],
          ["Invoice", order.invoiceId ?? "—"],
          ["Payment URL", order.paymentUrl ?? "—"],
          ["Paid at", order.paidAt ?? "—"],
          ["Expires", order.expiresAt],
          ["Discord notified", order.discordNotified ? "yes" : "no"],
          ["Fulfilled at", order.fulfilledAt ?? "—"],
          ["Fulfillment note", order.fulfillmentNote ?? "—"],
          ["Fulfilled by", order.fulfilledBy ?? "—"],
          ["Created", order.createdAt],
          ["Updated", order.updatedAt],
        ].map(([k, v]) => (
          <div>
            <dt class="font-mono text-xs text-muted">{k}</dt>
            <dd class="mt-0.5 break-all">{v}</dd>
          </div>
        ))}
      </dl>

      {order.status === "paid" ? (
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          {!order.fulfilledAt ? (
            <form
              method="post"
              action={`/admin/orders/${order.id}/fulfill`}
              class="rounded-md border border-border bg-panel p-4 space-y-2"
            >
              <h2 class="text-sm font-medium">Tandai fulfilled</h2>
              <textarea
                name="note"
                rows={3}
                placeholder="Catatan internal (opsional)"
                class="w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm"
              />
              <button type="submit" class="rounded-md bg-brand px-3 py-1.5 text-sm text-background">
                Fulfill
              </button>
            </form>
          ) : (
            <form method="post" action={`/admin/orders/${order.id}/unfulfill`} class="rounded-md border border-border bg-panel p-4">
              <h2 class="text-sm font-medium">Batalkan fulfillment</h2>
              <button
                type="submit"
                class="mt-2 rounded-md border border-border px-3 py-1.5 text-sm"
              >
                Unfulfill
              </button>
            </form>
          )}
        </div>
      ) : null}

      <h2 class="mt-8 text-sm font-medium">Payment events</h2>
      <div class="mt-2 space-y-3">
        {events.length === 0 ? (
          <p class="text-sm text-muted">Belum ada event.</p>
        ) : (
          events.map((e) => (
            <details class="rounded-md border border-border bg-panel p-3 text-sm">
              <summary class="cursor-pointer">
                <span class="font-mono text-xs text-muted">{e.createdAt}</span>{" "}
                <span class="text-brand">{e.source}</span> — {e.message}{" "}
                <span class="text-muted">({e.processedOk ? "ok" : "fail"})</span>
              </summary>
              <pre class="mt-2 overflow-x-auto rounded bg-elevated p-2 font-mono text-xs text-muted">
                {JSON.stringify({ rawBody: e.rawBody, checkResult: e.checkResult }, null, 2)}
              </pre>
            </details>
          ))
        )}
      </div>
    </div>
  );
};
