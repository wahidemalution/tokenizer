import type { FC } from "hono/jsx";
import type { AdminUserPublic } from "../../lib/admin-users";
import {
  Alert,
  Btn,
  Card,
  CardHeader,
  EmptyState,
  Field,
  PageHeader,
  Pill,
  formatDateTime,
  inputClass,
} from "../ui";

export const UsersPage: FC<{
  users: AdminUserPublic[];
  currentUserId: string;
  error?: string | null;
  ok?: string | null;
}> = ({ users, currentUserId, error, ok }) => {
  const errMap: Record<string, string> = {
    "cannot-self-deactivate": "Tidak bisa menonaktifkan akun sendiri.",
    "password-short": "Password minimal 8 karakter.",
    "username-empty": "Username wajib diisi.",
    create: "Gagal membuat user (mungkin username sudah dipakai).",
  };
  const okMap: Record<string, string> = {
    created: "User dibuat.",
    deactivated: "User dinonaktifkan.",
    activated: "User diaktifkan.",
    password: "Password diubah.",
  };

  return (
    <div>
      {error ? <Alert tone="error">{errMap[error] ?? error}</Alert> : null}
      {ok ? <Alert tone="success">{okMap[ok] ?? ok}</Alert> : null}

      <PageHeader
        title="Users"
        description="Kelola operator yang dapat mengakses dashboard admin."
      />

      <div class="grid gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <Card padding={false} class="overflow-hidden">
            <div class="border-b border-border px-5 py-4">
              <h2 class="text-sm font-semibold">Daftar operator</h2>
              <p class="mt-0.5 text-xs text-muted">{users.length} akun</p>
            </div>
            {users.length === 0 ? (
              <EmptyState title="Belum ada user" />
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr class="border-b border-border text-[11px] font-medium uppercase tracking-wide text-faint">
                      <th class="px-5 py-3">User</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3">Dibuat</th>
                      <th class="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    {users.map((u) => (
                      <tr class="hover:bg-elevated/30">
                        <td class="px-5 py-4">
                          <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-elevated text-xs font-semibold uppercase text-brand ring-1 ring-border">
                              {u.username.slice(0, 1)}
                            </div>
                            <div>
                              <div class="font-medium">
                                {u.username}
                                {u.id === currentUserId ? (
                                  <span class="ml-2 text-[10px] font-normal text-faint">(you)</span>
                                ) : null}
                              </div>
                              <div class="font-mono text-[10px] text-faint">{u.role}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-4">
                          {u.isActive ? (
                            <Pill tone="success">Active</Pill>
                          ) : (
                            <Pill tone="danger">Inactive</Pill>
                          )}
                        </td>
                        <td class="px-4 py-4 font-mono text-xs text-muted">
                          {formatDateTime(u.createdAt)}
                        </td>
                        <td class="px-4 py-4">
                          <div class="flex flex-col items-end gap-2">
                            {u.id !== currentUserId ? (
                              u.isActive ? (
                                <form method="post" action={`/admin/users/${u.id}/deactivate`}>
                                  <Btn type="submit" variant="ghost" size="sm">
                                    Nonaktifkan
                                  </Btn>
                                </form>
                              ) : (
                                <form method="post" action={`/admin/users/${u.id}/activate`}>
                                  <Btn type="submit" variant="secondary" size="sm">
                                    Aktifkan
                                  </Btn>
                                </form>
                              )
                            ) : null}
                            <form
                              method="post"
                              action={`/admin/users/${u.id}/password`}
                              class="flex max-w-[14rem] gap-1.5"
                            >
                              <input
                                type="password"
                                name="password"
                                placeholder="Password baru"
                                minlength={8}
                                required
                                class={`${inputClass} py-1.5 text-xs`}
                              />
                              <Btn type="submit" variant="secondary" size="sm">
                                Set
                              </Btn>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div class="lg:col-span-2">
          <Card>
            <CardHeader
              title="Tambah operator"
              description="Password minimal 8 karakter. Discord ID opsional (untuk OAuth nanti)."
            />
            <form method="post" action="/admin/users" class="space-y-4">
              <Field label="Username" name="username">
                <input
                  id="username"
                  name="username"
                  required
                  class={inputClass}
                  placeholder="ops"
                  autocomplete="off"
                />
              </Field>
              <Field label="Password" name="password">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minlength={8}
                  class={inputClass}
                  placeholder="Min. 8 karakter"
                  autocomplete="new-password"
                />
              </Field>
              <Field label="Discord ID" name="discord_id" hint="Opsional">
                <input
                  id="discord_id"
                  name="discord_id"
                  class={inputClass}
                  placeholder="1234567890"
                />
              </Field>
              <Btn type="submit" variant="primary" class="w-full">
                Buat user
              </Btn>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
