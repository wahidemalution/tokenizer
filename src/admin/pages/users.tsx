import type { FC } from "hono/jsx";
import type { AdminUserPublic } from "../../lib/admin-users";

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
      {error ? (
        <div class="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errMap[error] ?? error}
        </div>
      ) : null}
      {ok ? (
        <div class="mb-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
          {okMap[ok] ?? ok}
        </div>
      ) : null}

      <h1 class="text-xl font-semibold">Admin users</h1>
      <p class="mt-1 text-sm text-muted">Kelola operator dashboard.</p>

      <div class="mt-6 overflow-x-auto rounded-md border border-border">
        <table class="w-full text-left text-sm">
          <thead class="bg-panel text-xs text-muted">
            <tr>
              <th class="px-3 py-2">Username</th>
              <th class="px-3 py-2">Active</th>
              <th class="px-3 py-2">Created</th>
              <th class="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr class="border-t border-border">
                <td class="px-3 py-2">
                  {u.username}
                  {u.id === currentUserId ? (
                    <span class="ml-2 text-xs text-muted">(you)</span>
                  ) : null}
                </td>
                <td class="px-3 py-2">{u.isActive ? "yes" : "no"}</td>
                <td class="px-3 py-2 font-mono text-xs text-muted">
                  {new Date(u.createdAt).toLocaleString("id-ID")}
                </td>
                <td class="px-3 py-2">
                  <div class="flex flex-wrap gap-2">
                    {u.id !== currentUserId ? (
                      u.isActive ? (
                        <form method="post" action={`/admin/users/${u.id}/deactivate`}>
                          <button type="submit" class="text-xs text-muted hover:text-foreground">
                            Deactivate
                          </button>
                        </form>
                      ) : (
                        <form method="post" action={`/admin/users/${u.id}/activate`}>
                          <button type="submit" class="text-xs text-brand hover:underline">
                            Activate
                          </button>
                        </form>
                      )
                    ) : null}
                    <form method="post" action={`/admin/users/${u.id}/password`} class="flex gap-1">
                      <input
                        type="password"
                        name="password"
                        placeholder="password baru"
                        minlength={8}
                        required
                        class="rounded border border-border bg-elevated px-1 py-0.5 text-xs"
                      />
                      <button type="submit" class="text-xs text-muted hover:text-foreground">
                        Set
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        method="post"
        action="/admin/users"
        class="mt-8 max-w-md space-y-3 rounded-md border border-border bg-panel p-4"
      >
        <h2 class="text-sm font-medium">Tambah user</h2>
        <input
          name="username"
          required
          placeholder="username"
          class="w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          minlength={8}
          placeholder="password (min 8)"
          class="w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm"
        />
        <input
          name="discord_id"
          placeholder="discord id (opsional)"
          class="w-full rounded-md border border-border bg-elevated px-2 py-1.5 text-sm"
        />
        <button type="submit" class="rounded-md bg-brand px-3 py-1.5 text-sm text-background">
          Buat
        </button>
      </form>
    </div>
  );
};
