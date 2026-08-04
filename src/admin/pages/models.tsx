import type { FC } from "hono/jsx";
import type { Model } from "../../lib/models";
import { MODEL_STATUS_META } from "../../lib/models";
import { adminUrl } from "../../lib/admin-url";
import {
  Alert,
  Btn,
  Card,
  CsrfField,
  EmptyState,
  PageHeader,
  Pill,
} from "../ui";

export const ModelsPage: FC<{
  models: Model[];
  error?: string | null;
  ok?: string | null;
  csrfToken: string;
}> = ({ models, error, ok, csrfToken }) => {
  const errMap: Record<string, string> = {
    "name-empty": "Nama model wajib diisi.",
    "provider-empty": "Provider wajib diisi.",
    "invalid-status": "Status tidak valid.",
    "not-found": "Model tidak ditemukan.",
  };
  const okMap: Record<string, string> = {
    created: "Model ditambahkan.",
    updated: "Model diperbarui.",
    deleted: "Model dihapus.",
  };

  return (
    <div>
      {error ? <Alert tone="error">{errMap[error] ?? error}</Alert> : null}
      {ok ? <Alert tone="success">{okMap[ok] ?? ok}</Alert> : null}

      <PageHeader
        title="Models"
        description="Atur daftar model AI yang tampil di landing page. Set status ketersediaan dan visibilitas tiap model."
        actions={
          <Btn href={adminUrl("/models/new")} variant="primary" size="sm">
            Tambah model
          </Btn>
        }
      />

      <Card padding={false} class="overflow-hidden">
        <div class="border-b border-border px-5 py-4">
          <h2 class="text-sm font-semibold">Daftar model</h2>
          <p class="mt-0.5 text-xs text-muted">{models.length} model</p>
        </div>
        {models.length === 0 ? (
          <EmptyState
            title="Belum ada model"
            description="Jalankan seed awal atau tambahkan model baru."
          />
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr class="border-b border-border text-[11px] font-medium uppercase tracking-wide text-faint">
                  <th class="px-5 py-3">Model</th>
                  <th class="px-4 py-3">Provider</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Visibilitas</th>
                  <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {models.map((model) => {
                  const meta = MODEL_STATUS_META[model.status];
                  return (
                    <tr class="hover:bg-elevated/30">
                      <td class="px-5 py-4">
                        <div class="font-medium">{model.name}</div>
                        <div class="font-mono text-[10px] text-faint">{model.id}</div>
                      </td>
                      <td class="px-4 py-4 font-mono text-xs text-muted">
                        {model.provider}
                      </td>
                      <td class="px-4 py-4">
                        <Pill tone={meta.tone}>{meta.label}</Pill>
                      </td>
                      <td class="px-4 py-4">
                        {model.isVisible ? (
                          <Pill tone="success">Tampil</Pill>
                        ) : (
                          <Pill tone="danger">Disembunyikan</Pill>
                        )}
                      </td>
                      <td class="px-4 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <Btn
                            href={adminUrl(`/models/${model.id}/edit`)}
                            variant="secondary"
                            size="sm"
                          >
                            Edit
                          </Btn>
                          <form
                            method="post"
                            action={adminUrl(`/models/${model.id}/delete`)}
                            class="inline"
                          >
                            <CsrfField token={csrfToken} />
                            <Btn type="submit" variant="danger" size="sm">
                              Hapus
                            </Btn>
                            <span
                              class="hidden"
                              data-confirm="Hapus model ini? Tindakan tidak bisa dibatalkan."
                            />
                          </form>
                        </div>
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
  );
};
