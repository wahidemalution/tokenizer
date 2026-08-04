import type { FC } from "hono/jsx";
import type { Plan } from "../../lib/plans";
import { formatIdr, computeAmountIdr } from "../../lib/plans";
import { adminUrl } from "../../lib/admin-url";
import {
  Alert,
  Btn,
  Card,
  CardHeader,
  CsrfField,
  Field,
  PageHeader,
  inputClass,
  textareaClass,
} from "../ui";

const checkboxClass =
  "h-4 w-4 rounded border-border bg-background text-brand focus:ring-2 focus:ring-brand/30";

export const PlanEditPage: FC<{
  plan: Plan;
  error?: string | null;
  ok?: string | null;
  csrfToken: string;
}> = ({ plan, error, ok, csrfToken }) => {
  const errMap: Record<string, string> = {
    "base-negative": "Harga dasar tidak boleh negatif.",
    "discount-range": "Diskon harus di antara 0–100.",
    "name-empty": "Nama paket wajib diisi.",
    "tokens-empty": "Kuota wajib diisi.",
    "duration-empty": "Masa aktif wajib diisi.",
  };
  const okMap: Record<string, string> = { updated: "Paket diperbarui." };
  const finalPreview = formatIdr(computeAmountIdr(plan.basePriceIdr, plan.discountPercent));

  return (
    <div>
      {error ? <Alert tone="error">{errMap[error] ?? error}</Alert> : null}
      {ok ? <Alert tone="success">{okMap[ok] ?? ok}</Alert> : null}

      <PageHeader
        title={`Edit ${plan.name}`}
        description="Perubahan langsung tampil di halaman utama dan halaman harga. Harga final dihitung otomatis."
        breadcrumb={[
          { label: "Paket", href: adminUrl("/plans") },
          { label: plan.name },
        ]}
      />

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <Card>
            <CardHeader title="Detail paket" description={`ID: ${plan.id}`} />
            <form
              method="post"
              action={adminUrl(`/plans/${plan.id}`)}
              class="space-y-5"
            >
              <CsrfField token={csrfToken} />

              <div class="grid gap-4 sm:grid-cols-2">
                <Field label="Nama paket" name="name">
                  <input
                    id="name"
                    name="name"
                    required
                    class={inputClass}
                    value={plan.name}
                  />
                </Field>
                <Field label="Kuota" name="tokens" hint="Mis. 10M token">
                  <input
                    id="tokens"
                    name="tokens"
                    required
                    class={inputClass}
                    value={plan.tokens}
                  />
                </Field>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Harga dasar (Rp)"
                  name="base_price_idr"
                  hint="Harga sebelum diskon. Cth. 10000 untuk Rp10.000."
                >
                  <input
                    id="base_price_idr"
                    name="base_price_idr"
                    type="number"
                    min={0}
                    step={1}
                    required
                    class={inputClass}
                    value={plan.basePriceIdr}
                  />
                </Field>
                <Field
                  label="Diskon (%)"
                  name="discount_percent"
                  hint="0–100. Harga final dihitung otomatis."
                >
                  <input
                    id="discount_percent"
                    name="discount_percent"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    required
                    class={inputClass}
                    value={plan.discountPercent}
                  />
                </Field>
              </div>

              <div
                id="price-preview"
                class="flex items-center justify-between rounded-lg border border-border bg-elevated/40 px-4 py-3 text-sm"
              >
                <span class="text-muted">Harga final (otomatis):</span>
                <span
                  id="price-preview-value"
                  class="font-mono font-semibold text-foreground"
                >
                  {finalPreview}
                </span>
              </div>

              <Field
                label="Deskripsi"
                name="description"
                hint="Teks pendek di kartu paket. Opsional."
              >
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  class={textareaClass}
                  placeholder="Mis. Cocok untuk coba trial"
                >
                  {plan.description ?? ""}
                </textarea>
              </Field>

              <div class="grid gap-4 sm:grid-cols-2">
                <Field label="Masa aktif" name="duration">
                  <input
                    id="duration"
                    name="duration"
                    required
                    class={inputClass}
                    value={plan.duration}
                  />
                </Field>
                <Field label="Urutan tampil" name="sort_order" hint="Angka kecil tampil lebih dulu">
                  <input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min={0}
                    step={1}
                    required
                    class={inputClass}
                    value={plan.sortOrder}
                  />
                </Field>
              </div>

              <fieldset class="space-y-3">
                <legend class="text-xs font-medium text-muted">Badge & status</legend>
                <label class="flex items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="is_popular"
                    value="1"
                    class={checkboxClass}
                    checked={plan.isPopular}
                  />
                  Tandai sebagai Populer (badge di kartu)
                </label>
                <label class="flex items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="is_limited"
                    value="1"
                    class={checkboxClass}
                    checked={plan.isLimited}
                  />
                  Tampilkan badge Terbatas
                </label>
                <label class="flex items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="1"
                    class={checkboxClass}
                    checked={plan.isActive}
                  />
                  Aktif (tampil di halaman publik)
                </label>
              </fieldset>

              <div class="flex items-center gap-2 pt-1">
                <Btn type="submit" variant="primary">
                  Simpan perubahan
                </Btn>
                <Btn href={adminUrl("/plans")} variant="ghost">
                  Batal
                </Btn>
              </div>
            </form>
          </Card>
        </div>

        <div class="lg:col-span-1">
          <Card>
            <CardHeader title="Ringkasan saat ini" />
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Harga dasar</dt>
                <dd class="font-mono text-foreground">{formatIdr(plan.basePriceIdr)}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Diskon</dt>
                <dd class="font-mono text-foreground">{plan.discountPercent}%</dd>
              </div>
              <div class="flex justify-between gap-3 border-t border-border pt-3">
                <dt class="text-muted">Harga final</dt>
                <dd class="font-mono font-semibold text-foreground">{plan.priceLabel}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Per 1M token</dt>
                <dd class="font-mono text-muted">
                  {formatIdr(
                    Math.round(
                      plan.amountIdr /
                        (Number.parseInt(plan.name, 10) || 1)
                    )
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
  const base = document.getElementById("base_price_idr");
  const disc = document.getElementById("discount_percent");
  const out = document.getElementById("price-preview-value");
  if (!base || !disc || !out) return;
  const fmt = (n) => "Rp" + Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
  const recompute = () => {
    const b = Math.max(0, Number(base.value) || 0);
    const d = Math.max(0, Math.min(100, Number(disc.value) || 0));
    out.textContent = fmt(Math.round((b * (100 - d)) / 100));
  };
  base.addEventListener("input", recompute);
  disc.addEventListener("input", recompute);
})();`,
        }}
      />
    </div>
  );
};
