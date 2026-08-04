import type { FC } from "hono/jsx";
import type { Plan, PricingText } from "../../lib/plans";
import { formatIdr } from "../../lib/plans";
import { adminUrl } from "../../lib/admin-url";
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
  inputClass,
  textareaClass,
} from "../ui";

export const PlansPage: FC<{
  plans: Plan[];
  pricingText: PricingText;
  error?: string | null;
  ok?: string | null;
  csrfToken: string;
}> = ({ plans, pricingText, error, ok, csrfToken }) => {
  const errMap: Record<string, string> = {
    "text-empty": "Teks bagian harga tidak boleh kosong.",
    updated: "",
  };
  const okMap: Record<string, string> = {
    updated: "Paket diperbarui.",
    "text-updated": "Teks bagian harga diperbarui.",
  };

  return (
    <div>
      {error ? <Alert tone="error">{errMap[error] ?? error}</Alert> : null}
      {ok ? <Alert tone="success">{okMap[ok] ?? ok}</Alert> : null}

      <PageHeader
        title="Paket"
        description="Atur harga, diskon, deskripsi, dan badge paket yang tampil di halaman utama dan harga. Harga final dihitung otomatis dari harga dasar dikurangi diskon."
      />

      <div class="grid gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <Card padding={false} class="overflow-hidden">
            <div class="border-b border-border px-5 py-4">
              <h2 class="text-sm font-semibold">Daftar paket</h2>
              <p class="mt-0.5 text-xs text-muted">{plans.length} paket</p>
            </div>
            {plans.length === 0 ? (
              <EmptyState
                title="Belum ada paket"
                description="Jalankan seed awal atau tambahkan paket baru."
              />
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-border text-[11px] font-medium uppercase tracking-wide text-faint">
                      <th class="px-5 py-3">Paket</th>
                      <th class="px-4 py-3">Harga dasar</th>
                      <th class="px-4 py-3">Diskon</th>
                      <th class="px-4 py-3">Harga final</th>
                      <th class="px-4 py-3">Badge</th>
                      <th class="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    {plans.map((plan) => {
                      const finalIdr = plan.amountIdr;
                      const hasDiscount = plan.discountPercent > 0;
                      return (
                        <tr class="hover:bg-elevated/30">
                          <td class="px-5 py-4">
                            <div class="font-medium">{plan.name}</div>
                            <div class="font-mono text-[10px] text-faint">{plan.id}</div>
                            <div class="text-xs text-muted">{plan.tokens}</div>
                          </td>
                          <td class="px-4 py-4 font-mono text-xs text-muted">
                            {formatIdr(plan.basePriceIdr)}
                          </td>
                          <td class="px-4 py-4">
                            {hasDiscount ? (
                              <Pill tone="warning">{plan.discountPercent}%</Pill>
                            ) : (
                              <span class="text-faint">—</span>
                            )}
                          </td>
                          <td class="px-4 py-4 font-mono text-xs text-foreground">
                            {formatIdr(finalIdr)}
                          </td>
                          <td class="px-4 py-4">
                            <div class="flex flex-wrap gap-1">
                              {plan.isPopular ? <Pill tone="success">Populer</Pill> : null}
                              {plan.isLimited ? <Pill tone="warning">Terbatas</Pill> : null}
                              {plan.isActive ? (
                                <Pill tone="success">Aktif</Pill>
                              ) : (
                                <Pill tone="danger">Nonaktif</Pill>
                              )}
                            </div>
                          </td>
                          <td class="px-4 py-4 text-right">
                            <Btn
                              href={adminUrl(`/plans/${plan.id}/edit`)}
                              variant="secondary"
                              size="sm"
                            >
                              Edit
                            </Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div class="lg:col-span-2">
          <Card>
            <CardHeader
              title="Teks bagian harga"
              description="Subjudul dan catatan kecil pada bagian harga di halaman utama dan halaman /pricing."
            />
            <form
              method="post"
              action={adminUrl("/pricing-text")}
              class="space-y-4"
            >
              <CsrfField token={csrfToken} />
              <Field label="Subjudul" name="subtitle">
                <input
                  id="subtitle"
                  name="subtitle"
                  required
                  class={inputClass}
                  value={pricingText.subtitle}
                />
              </Field>
              <Field label="Catatan kecil" name="note">
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  required
                  class={textareaClass}
                >
                  {pricingText.note}
                </textarea>
              </Field>
              <Btn type="submit" variant="primary" class="w-full">
                Simpan teks
              </Btn>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
