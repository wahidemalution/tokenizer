import type { FC, Child } from "hono/jsx";
import type { AdminUserPublic } from "../lib/admin-users";
import { Layout } from "../server";

export const AdminLayout: FC<{
  title: string;
  user?: AdminUserPublic | null;
  children: Child;
  flash?: string | null;
  error?: string | null;
}> = ({ title, user, children, flash, error }) => {
  return (
    <Layout title={`${title} — Admin TOKENIZER`}>
      <div class="min-h-screen bg-background text-foreground">
        {user ? (
          <header class="border-b border-border bg-panel">
            <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <div class="flex items-center gap-6">
                <a href="/admin" class="font-mono text-sm text-brand">
                  // admin
                </a>
                <nav class="flex gap-4 text-sm text-muted">
                  <a href="/admin" class="hover:text-foreground">
                    Dashboard
                  </a>
                  <a href="/admin/orders" class="hover:text-foreground">
                    Orders
                  </a>
                  <a href="/admin/users" class="hover:text-foreground">
                    Users
                  </a>
                </nav>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="text-muted">{user.username}</span>
                <form method="post" action="/admin/logout">
                  <button
                    type="submit"
                    class="rounded-md border border-border px-2 py-1 text-muted hover:text-foreground"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>
        ) : null}
        <main class="mx-auto max-w-6xl px-4 py-8">
          {error ? (
            <div class="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {flash ? (
            <div class="mb-4 rounded-md border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
              {flash}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </Layout>
  );
};
