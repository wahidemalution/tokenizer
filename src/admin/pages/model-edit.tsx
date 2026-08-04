import type { FC } from "hono/jsx";
import type { Model } from "../../lib/models";
import { MODEL_STATUSES, MODEL_STATUS_META } from "../../lib/models";
import { adminUrl } from "../../lib/admin-url";
import {
  Alert,
  Btn,
  Card,
  CardHeader,
  CsrfField,
  Field,
  PageHeader,
  Pill,
  inputClass,
  selectClass,
} from "../ui";

const checkboxClass =
  "h-4 w-4 rounded border-border bg-background text-brand focus:ring-2 focus:ring-brand/30";

export const ModelEditPage: FC<{
  model: Model | null;
  error?: string | null;
  ok?: string | null;
  csrfToken: string;
}> = ({ model, error, ok, csrfToken }) => {
  const errMap: Record<string, string> = {
    "name-empty": "Nama model wajib diisi.",
    "provider-empty": "Provider wajib diisi.",
    "invalid-status": "Status tidak valid.",
  };
  const okMap: Record<string, string> = { updated: "Model diperbarui." };
  const isEdit = model !== null;

  return (
    <div>
      {error ? <Alert tone="error">{errMap[error] ?? error}</Alert> : null}
      {ok ? <Alert tone="success">{okMap[ok] ?? ok}</Alert> : null}

      <PageHeader
        title={isEdit ? `Edit ${model!.name}` : "Tambah model"}
        description="Perubahan langsung tampil di halaman utama."
        breadcrumb={[
          { label: "Models", href: adminUrl("/models") },
          { label: isEdit ? model!.name : "Baru" },
        ]}
      />

      <div class="grid gap-6 lg:grid-cols-3">
        <div class={isEdit ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader
              title="Detail model"
              description={isEdit ? `ID: ${model!.id}` : "Model baru"}
            />
            <form
              method="post"
              action={isEdit ? adminUrl(`/models/${model!.id}`) : adminUrl("/models")}
              class="space-y-5"
            >
              <CsrfField token={csrfToken} />

              <div class="grid gap-4 sm:grid-cols-2">
                <Field label="Nama model" name="name">
                  <input
                    id="name"
                    name="name"
                    required
                    class={inputClass}
                    value={isEdit ? model!.name : ""}
                  />
                </Field>
                <Field label="Provider" name="provider" hint="Mis. OpenAI">
                  <input
                    id="provider"
                    name="provider"
                    required
                    class={inputClass}
                    value={isEdit ? model!.provider : ""}
                  />
                </Field>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <Field label="Status" name="status" hint="Tampil sebagai badge berwarna di landing page">
                  <select
                    id="status"
                    name="status"
                    required
                    class={selectClass}
                  >
                    {MODEL_STATUSES.map((s) => (
                      <option value={s} selected={isEdit ? model!.status === s : s === "available"}>
                        {MODEL_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
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
                    value={isEdit ? model!.sortOrder : 0}
                  />
                </Field>
              </div>

              <fieldset class="space-y-3">
                <legend class="text-xs font-medium text-muted">Visibilitas</legend>
                <label class="flex items-center gap-2.5 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="is_visible"
                    value="1"
                    class={checkboxClass}
                    checked={isEdit ? model!.isVisible : true}
                  />
                  Tampil di halaman publik
                </label>
              </fieldset>

              <div class="flex items-center gap-2 pt-1">
                <Btn type="submit" variant="primary">
                  Simpan
                </Btn>
                <Btn href={adminUrl("/models")} variant="ghost">
                  Batal
                </Btn>
              </div>
            </form>
          </Card>
        </div>

        {isEdit ? (
          <div class="lg:col-span-1">
            <Card>
              <CardHeader title="Status saat ini" />
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted">Status</span>
                  <Pill tone={MODEL_STATUS_META[model!.status].tone}>
                    {MODEL_STATUS_META[model!.status].label}
                  </Pill>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted">Visibilitas</span>
                  {model!.isVisible ? (
                    <Pill tone="success">Tampil</Pill>
                  ) : (
                    <Pill tone="danger">Disembunyikan</Pill>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};
