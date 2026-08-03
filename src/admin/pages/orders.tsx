import type { FC } from "hono/jsx";
import type { Order } from "../../lib/orders";
import { adminUrl } from "../../lib/admin-url";
import { formatIdr } from "../../lib/plans";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  StatusBadge,
  formatDateShort,
  inputClass,
  selectClass,
} from "../ui";

export const OrdersPage: FC<{
  rows: Order[];
  total: number;
  page: number;
  perPage: number;
  filters: { status: string; fulfilled: string; q: string };
}> = ({ rows, total, page, perPage, filters }) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (filters.status && filters.status !== "all") u.set("status", filters.status);
    if (filters.fulfilled && filters.fulfilled !== "all") u.set("fulfilled", filters.fulfilled);
    if (filters.q) u.set("q", filters.q);
    u.set("page", String(p));
    return `${adminUrl("/orders")}?${u.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total} order terdaftar. Filter, cari, lalu buka detail untuk fulfill.`}
      />

      <Card padding={false} class="overflow-hidden">
        <form
          method="get"
          action={adminUrl("/orders")}
          class="flex flex-col gap-3 border-b border-border bg-elevated/30 p-4 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div class="min-w-[8rem] flex-1 sm:max-w-[10rem]">
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint">
              Status
            </label>
            <select name="status" class={selectClass}>
              {[
                ["all", "Semua"],
                ["pending", "Pending"],
                ["paid", "Paid"],
                ["expired", "Expired"],
              ].map(([v, label]) => (
                <option value={v} selected={filters.status === v}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div class="min-w-[8rem] flex-1 sm:max-w-[10rem]">
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint">
              Fulfilled
            </label>
            <select name="fulfilled" class={selectClass}>
              {[
                ["all", "Semua"],
                ["yes", "Sudah"],
                ["no", "Belum"],
              ].map(([v, label]) => (
                <option value={v} selected={filters.fulfilled === v}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div class="min-w-0 flex-[2]">
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-faint">
              Cari
            </label>
            <input
              name="q"
              value={filters.q}
              placeholder="Email, invoice, atau order ID…"
              class={inputClass}
            />
          </div>
          <Btn type="submit" variant="primary" size="sm" class="sm:mb-0.5">
            Terapkan
          </Btn>
        </form>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr class="border-b border-border bg-panel text-[11px] font-medium uppercase tracking-wide text-faint">
                <th class="px-4 py-3">Waktu</th>
                <th class="px-4 py-3">Pelanggan</th>
                <th class="px-4 py-3">Paket</th>
                <th class="px-4 py-3">Nominal</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Fulfill</th>
                <th class="px-4 py-3">Invoice</th>
                <th class="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colspan={8}>
                    <EmptyState
                      title="Tidak ada order"
                      description="Ubah filter atau tunggu checkout baru masuk."
                    />
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr class="transition-colors hover:bg-elevated/40">
                    <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {formatDateShort(o.createdAt)}
                    </td>
                    <td class="px-4 py-3">
                      <a
                        href={adminUrl(`/orders/${o.id}`)}
                        class="font-medium text-foreground hover:text-brand"
                      >
                        {o.email}
                      </a>
                      <div class="mt-0.5 font-mono text-[10px] text-faint">{o.id.slice(0, 8)}…</div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="font-medium">{o.planName}</div>
                      <div class="text-xs text-muted">{o.tokens}</div>
                    </td>
                    <td class="px-4 py-3 tabular-nums font-medium">
                      {formatIdr(o.finalAmountIdr ?? o.amountIdr)}
                    </td>
                    <td class="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td class="px-4 py-3">
                      {o.status !== "paid" ? (
                        <span class="text-xs text-faint">—</span>
                      ) : o.fulfilledAt ? (
                        <Pill tone="success">Done</Pill>
                      ) : (
                        <Pill tone="warning">Open</Pill>
                      )}
                    </td>
                    <td class="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-muted">
                      {o.invoiceId ?? "—"}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <Btn href={adminUrl(`/orders/${o.id}`)} variant="ghost" size="sm">
                        Detail
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-3 border-t border-border bg-elevated/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-muted">
            Menampilkan <span class="text-foreground">{from}–{to}</span> dari{" "}
            <span class="text-foreground">{total}</span>
          </p>
          <div class="flex items-center gap-2">
            {page > 1 ? (
              <Btn href={qs(page - 1)} variant="secondary" size="sm">
                Sebelumnya
              </Btn>
            ) : (
              <span class="rounded-lg border border-border px-2.5 py-1.5 text-xs text-faint opacity-50">
                Sebelumnya
              </span>
            )}
            <span class="px-2 font-mono text-xs text-muted">
              {page} / {pages}
            </span>
            {page < pages ? (
              <Btn href={qs(page + 1)} variant="secondary" size="sm">
                Berikutnya
              </Btn>
            ) : (
              <span class="rounded-lg border border-border px-2.5 py-1.5 text-xs text-faint opacity-50">
                Berikutnya
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
