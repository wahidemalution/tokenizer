import type { FC } from "hono/jsx";
import type { DashboardStats } from "../../lib/orders";
import { adminUrl } from "../../lib/admin-url";
import { formatIdr } from "../../lib/plans";
import { Btn, Card, PageHeader } from "../ui";

export const DashboardPage: FC<{ stats: DashboardStats }> = ({ stats }) => {
  const cards = [
    {
      label: "Pending",
      value: String(stats.pending),
      hint: "Menunggu pembayaran",
      href: adminUrl("/orders?status=pending"),
    },
    {
      label: "Paid hari ini",
      value: String(stats.paidToday),
      hint: "Zona Asia/Jakarta",
      href: adminUrl("/orders?status=paid"),
    },
    {
      label: "Revenue hari ini",
      value: formatIdr(stats.revenueTodayIdr),
      hint: "Total final amount",
      href: adminUrl("/orders?status=paid"),
    },
    {
      label: "Expired",
      value: String(stats.expired),
      hint: "Invoice kadaluarsa",
      href: adminUrl("/orders?status=expired"),
    },
    {
      label: "Perlu fulfillment",
      value: String(stats.unfulfilledPaid),
      hint: "Paid, belum dikirim key",
      href: adminUrl("/orders?status=paid&fulfilled=no"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional order TOKENIZER. Metrik “hari ini” memakai zona waktu Asia/Jakarta."
        actions={
          <>
            <Btn href={adminUrl("/orders?status=paid&fulfilled=no")} variant="primary" size="sm">
              Antrian fulfill
            </Btn>
            <Btn href={adminUrl("/orders")} variant="secondary" size="sm">
              Semua orders
            </Btn>
          </>
        }
      />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <a
            href={c.href}
            class="group block rounded-xl border border-border bg-panel p-5 transition-colors hover:border-border-strong hover:bg-elevated/40"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="text-xs font-medium uppercase tracking-wide text-muted">{c.label}</span>
              <span class="text-faint opacity-0 transition-opacity group-hover:opacity-100">→</span>
            </div>
            <div class="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
              {c.value}
            </div>
            <p class="mt-2 text-xs text-faint">{c.hint}</p>
          </a>
        ))}
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 class="text-sm font-semibold">Alur kerja cepat</h2>
          <ol class="mt-4 space-y-3 text-sm text-muted">
            <li class="flex gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-[10px] text-brand ring-1 ring-border">
                1
              </span>
              <span>
                Pantau order <strong class="text-foreground">paid</strong> yang belum fulfilled.
              </span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-[10px] text-brand ring-1 ring-border">
                2
              </span>
              <span>Buka detail → verifikasi payment events / re-check bayar.gg bila perlu.</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-[10px] text-brand ring-1 ring-border">
                3
              </span>
              <span>Kirim API key, lalu tandai <strong class="text-foreground">fulfilled</strong> + catatan.</span>
            </li>
          </ol>
        </Card>

        <Card>
          <h2 class="text-sm font-semibold">Tautan</h2>
          <div class="mt-4 grid gap-2">
            <a
              href={adminUrl("/orders?status=paid")}
              class="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-border-strong"
            >
              <span>Order lunas</span>
              <span class="text-faint">→</span>
            </a>
            <a
              href={adminUrl("/orders?status=pending")}
              class="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-border-strong"
            >
              <span>Menunggu bayar</span>
              <span class="text-faint">→</span>
            </a>
            <a
              href={adminUrl("/users")}
              class="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-border-strong"
            >
              <span>Kelola operator</span>
              <span class="text-faint">→</span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
