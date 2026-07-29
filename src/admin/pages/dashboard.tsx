import type { FC } from "hono/jsx";
import type { DashboardStats } from "../../lib/orders";
import { formatIdr } from "../../lib/plans";

export const DashboardPage: FC<{ stats: DashboardStats }> = ({ stats }) => {
  const cards = [
    { label: "Pending", value: String(stats.pending) },
    { label: "Paid hari ini", value: String(stats.paidToday) },
    { label: "Revenue hari ini", value: formatIdr(stats.revenueTodayIdr) },
    { label: "Expired", value: String(stats.expired) },
    { label: "Belum fulfilled", value: String(stats.unfulfilledPaid) },
  ];
  return (
    <div>
      <h1 class="text-xl font-semibold">Dashboard</h1>
      <p class="mt-1 text-sm text-muted">Ringkasan order (zona Asia/Jakarta untuk “hari ini”).</p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div class="rounded-md border border-border bg-panel p-4">
            <div class="font-mono text-xs text-muted">{c.label}</div>
            <div class="mt-2 text-2xl font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>
      <p class="mt-6 text-sm">
        <a href="/admin/orders" class="text-brand hover:underline">
          Lihat semua orders →
        </a>
      </p>
    </div>
  );
};
