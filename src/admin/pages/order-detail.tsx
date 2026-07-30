import type { FC } from "hono/jsx";
import type { Order } from "../../lib/orders";
import type { PaymentEvent } from "../../lib/payment-events";
import { formatIdr } from "../../lib/plans";
import {
  Alert,
  Btn,
  Card,
  CardHeader,
  CsrfField,
  EmptyState,
  Field,
  PageHeader,
  Pill,
  StatusBadge,
  formatDateTime,
  inputClass,
} from "../ui";

function InfoRow({ label, children }: { label: string; children: any }) {
  return (
    <div class="grid grid-cols-1 gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-3 sm:gap-4">
      <dt class="text-xs font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd class="break-all text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

export const OrderDetailPage: FC<{
  order: Order;
  events: PaymentEvent[];
  ok?: string | null;
  error?: string | null;
  csrfToken: string;
}> = ({ order, events, ok, error, csrfToken }) => {
  const flash =
    ok === "fulfilled"
      ? "Order ditandai fulfilled."
      : ok === "unfulfilled"
        ? "Fulfillment dibatalkan."
        : ok === "recheck"
          ? "Recheck bayar.gg selesai."
          : null;
  const errText =
    error === "fulfill"
      ? "Gagal fulfill (hanya order berstatus paid)."
      : error === "recheck"
        ? "Recheck gagal atau pembayaran belum valid."
        : error ?? null;

  return (
    <div>
      {flash ? <Alert tone="success">{flash}</Alert> : null}
      {errText ? <Alert tone="error">{errText}</Alert> : null}

      <PageHeader
        breadcrumb={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.id.slice(0, 8) + "…" },
        ]}
        title={order.email}
        description={`Order ${order.id}`}
        actions={
          <>
            {order.invoiceId ? (
              <form method="post" action={`/admin/orders/${order.id}/recheck`}>
                <CsrfField token={csrfToken} />
                <Btn type="submit" variant="secondary" size="sm">
                  Re-check bayar.gg
                </Btn>
              </form>
            ) : null}
            <Btn href="/admin/orders" variant="ghost" size="sm">
              Kembali
            </Btn>
          </>
        }
      />

      <div class="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        {order.status === "paid" ? (
          order.fulfilledAt ? (
            <Pill tone="success">Fulfilled</Pill>
          ) : (
            <Pill tone="warning">Perlu fulfillment</Pill>
          )
        ) : null}
        {order.discordNotified ? <Pill tone="neutral">Discord notified</Pill> : null}
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informasi order" description="Snapshot paket & kontak checkout" />
            <dl>
              <InfoRow label="Status">
                <StatusBadge status={order.status} />
              </InfoRow>
              <InfoRow label="Paket">
                {order.planName}{" "}
                <span class="text-muted">· {order.tokens}</span>
              </InfoRow>
              <InfoRow label="Amount">{formatIdr(order.amountIdr)}</InfoRow>
              <InfoRow label="Final amount">
                {order.finalAmountIdr != null ? formatIdr(order.finalAmountIdr) : "—"}
              </InfoRow>
              <InfoRow label="Email">{order.email}</InfoRow>
              <InfoRow label="Discord">{order.discordId ?? "—"}</InfoRow>
              <InfoRow label="WhatsApp">{order.whatsapp ?? "—"}</InfoRow>
              <InfoRow label="Telegram">{order.telegram ?? "—"}</InfoRow>
              <InfoRow label="Invoice">
                <span class="font-mono text-xs">{order.invoiceId ?? "—"}</span>
              </InfoRow>
              <InfoRow label="Payment URL">
                {order.paymentUrl ? (
                  <a
                    href={order.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="text-brand hover:underline"
                  >
                    Buka link bayar ↗
                  </a>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow label="Paid at">{formatDateTime(order.paidAt)}</InfoRow>
              <InfoRow label="Expires">{formatDateTime(order.expiresAt)}</InfoRow>
              <InfoRow label="Created">{formatDateTime(order.createdAt)}</InfoRow>
              <InfoRow label="Updated">{formatDateTime(order.updatedAt)}</InfoRow>
            </dl>
          </Card>

          <Card padding={false}>
            <div class="border-b border-border px-5 py-4">
              <h2 class="text-sm font-semibold">Payment events</h2>
              <p class="mt-0.5 text-xs text-muted">
                Jejak webhook & re-check bayar.gg ({events.length})
              </p>
            </div>
            {events.length === 0 ? (
              <EmptyState
                title="Belum ada event"
                description="Event muncul saat webhook atau tombol re-check dijalankan."
              />
            ) : (
              <ul class="divide-y divide-border">
                {events.map((e) => (
                  <li>
                    <details class="group">
                      <summary class="flex cursor-pointer list-none flex-wrap items-center gap-2 px-5 py-3.5 hover:bg-elevated/40 [&::-webkit-details-marker]:hidden">
                        <span class="font-mono text-[11px] text-faint">
                          {formatDateTime(e.createdAt)}
                        </span>
                        <Pill tone="neutral">{e.source}</Pill>
                        <span class="text-sm font-medium">{e.message}</span>
                        {e.processedOk ? (
                          <Pill tone="success">ok</Pill>
                        ) : (
                          <Pill tone="danger">fail</Pill>
                        )}
                        <span class="ml-auto text-xs text-faint group-open:rotate-90 transition-transform">
                          ›
                        </span>
                      </summary>
                      <div class="border-t border-border bg-background px-5 py-3">
                        <pre class="overflow-x-auto rounded-lg border border-border bg-elevated p-3 font-mono text-[11px] leading-relaxed text-muted">
                          {JSON.stringify(
                            { rawBody: e.rawBody, checkResult: e.checkResult },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <CardHeader title="Fulfillment" description="Tandai setelah API key dikirim" />
            {order.status !== "paid" ? (
              <p class="text-sm text-muted">
                Fulfillment hanya tersedia untuk order berstatus <strong class="text-foreground">paid</strong>.
              </p>
            ) : !order.fulfilledAt ? (
              <form method="post" action={`/admin/orders/${order.id}/fulfill`} class="space-y-4">
                <CsrfField token={csrfToken} />
                <Field label="Catatan internal" name="note" hint="Opsional — mis. channel pengiriman key">
                  <textarea
                    id="note"
                    name="note"
                    rows={4}
                    placeholder="Contoh: key dikirim via email…"
                    class={inputClass}
                  />
                </Field>
                <Btn type="submit" variant="primary" class="w-full">
                  Tandai fulfilled
                </Btn>
              </form>
            ) : (
              <div class="space-y-4">
                <div class="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                  <div class="text-xs font-medium uppercase tracking-wide text-brand">Selesai</div>
                  <p class="mt-1 text-muted">{formatDateTime(order.fulfilledAt)}</p>
                  {order.fulfillmentNote ? (
                    <p class="mt-2 text-foreground">{order.fulfillmentNote}</p>
                  ) : null}
                  {order.fulfilledBy ? (
                    <p class="mt-2 font-mono text-[11px] text-faint">by {order.fulfilledBy}</p>
                  ) : null}
                </div>
                <form method="post" action={`/admin/orders/${order.id}/unfulfill`}>
                  <CsrfField token={csrfToken} />
                  <Btn type="submit" variant="danger" size="sm" class="w-full">
                    Batalkan fulfillment
                  </Btn>
                </form>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="ID teknis" />
            <dl class="space-y-3 text-xs">
              <div>
                <dt class="text-faint">Order ID</dt>
                <dd class="mt-0.5 break-all font-mono text-muted">{order.id}</dd>
              </div>
              <div>
                <dt class="text-faint">Plan ID</dt>
                <dd class="mt-0.5 font-mono text-muted">{order.planId}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
};
