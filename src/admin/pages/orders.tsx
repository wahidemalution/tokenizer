import type { FC } from "hono/jsx";
import type { Order, OrderStatus } from "../../lib/orders";
import { formatIdr } from "../../lib/plans";

function statusBadge(status: OrderStatus) {
  const colors: Record<OrderStatus, string> = {
    pending: "text-amber-300 border-amber-800",
    paid: "text-brand border-brand/40",
    expired: "text-muted border-border",
  };
  return (
    <span class={`rounded border px-1.5 py-0.5 font-mono text-xs ${colors[status]}`}>{status}</span>
  );
}

export const OrdersPage: FC<{
  rows: Order[];
  total: number;
  page: number;
  perPage: number;
  filters: { status: string; fulfilled: string; q: string };
}> = ({ rows, total, page, perPage, filters }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (filters.status && filters.status !== "all") u.set("status", filters.status);
    if (filters.fulfilled && filters.fulfilled !== "all") u.set("fulfilled", filters.fulfilled);
    if (filters.q) u.set("q", filters.q);
    u.set("page", String(p));
    return `/admin/orders?${u.toString()}`;
  };

  return (
    <div>
      <h1 class="text-xl font-semibold">Orders</h1>
      <p class="mt-1 text-sm text-muted">{total} order total</p>

      <form method="get" action="/admin/orders" class="mt-4 flex flex-wrap gap-2 text-sm">
        <select name="status" class="rounded-md border border-border bg-elevated px-2 py-1.5">
          {["all", "pending", "paid", "expired"].map((s) => (
            <option value={s} selected={filters.status === s}>
              status: {s}
            </option>
          ))}
        </select>
        <select name="fulfilled" class="rounded-md border border-border bg-elevated px-2 py-1.5">
          {["all", "yes", "no"].map((s) => (
            <option value={s} selected={filters.fulfilled === s}>
              fulfilled: {s}
            </option>
          ))}
        </select>
        <input
          name="q"
          value={filters.q}
          placeholder="email / invoice / id"
          class="min-w-[12rem] flex-1 rounded-md border border-border bg-elevated px-2 py-1.5"
        />
        <button type="submit" class="rounded-md bg-elevated px-3 py-1.5 border border-border">
          Filter
        </button>
      </form>

      <div class="mt-4 overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="bg-panel text-xs text-muted">
            <tr>
              <th class="px-3 py-2 font-medium">Created</th>
              <th class="px-3 py-2 font-medium">Email</th>
              <th class="px-3 py-2 font-medium">Plan</th>
              <th class="px-3 py-2 font-medium">Amount</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium">Fulfilled</th>
              <th class="px-3 py-2 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colspan={7} class="px-3 py-6 text-center text-muted">
                  Tidak ada order.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr class="border-t border-border hover:bg-panel/60">
                  <td class="px-3 py-2 font-mono text-xs text-muted whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td class="px-3 py-2">
                    <a href={`/admin/orders/${o.id}`} class="text-brand hover:underline">
                      {o.email}
                    </a>
                  </td>
                  <td class="px-3 py-2">{o.planName}</td>
                  <td class="px-3 py-2 tabular-nums">{formatIdr(o.finalAmountIdr ?? o.amountIdr)}</td>
                  <td class="px-3 py-2">{statusBadge(o.status)}</td>
                  <td class="px-3 py-2 text-xs text-muted">{o.fulfilledAt ? "yes" : "—"}</td>
                  <td class="px-3 py-2 font-mono text-xs text-muted">{o.invoiceId ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div class="mt-4 flex items-center gap-3 text-sm text-muted">
          {page > 1 ? (
            <a href={qs(page - 1)} class="text-brand hover:underline">
              ← Prev
            </a>
          ) : null}
          <span>
            Halaman {page} / {pages}
          </span>
          {page < pages ? (
            <a href={qs(page + 1)} class="text-brand hover:underline">
              Next →
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
