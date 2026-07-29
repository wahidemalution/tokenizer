import type { FC, Child } from "hono/jsx";
import type { AdminUserPublic } from "../lib/admin-users";
import { Layout } from "../server";
import { Alert } from "./ui";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    match: (p: string) => p === "/admin" || p === "/admin/",
    icon: (
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke-linejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    match: (p: string) => p.startsWith("/admin/orders"),
    icon: (
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <path d="M7 7h14l-1.5 9H8.5L7 7Z" stroke-linejoin="round" />
        <path d="M7 7 6 3H3" stroke-linecap="round" />
        <circle cx="10" cy="20" r="1.25" />
        <circle cx="18" cy="20" r="1.25" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    match: (p: string) => p.startsWith("/admin/users"),
    icon: (
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 19.5c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke-linecap="round" />
      </svg>
    ),
  },
];

function NavLinks({ path, mobile = false }: { path: string; mobile?: boolean }) {
  return (
    <nav class={mobile ? "flex gap-1 overflow-x-auto px-3 py-2" : "flex flex-col gap-0.5 px-3"}>
      {NAV.map((item) => {
        const active = item.match(path);
        return (
          <a
            href={item.href}
            class={
              mobile
                ? `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-brand/15 text-brand"
                      : "text-muted hover:bg-elevated hover:text-foreground"
                  }`
                : `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-brand/12 text-brand shadow-[inset_0_0_0_1px] shadow-brand/20"
                      : "text-muted hover:bg-elevated hover:text-foreground"
                  }`
            }
          >
            <span class={active ? "text-brand" : "text-faint"}>{item.icon}</span>
            <span class="font-medium">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export const AdminLayout: FC<{
  title: string;
  user?: AdminUserPublic | null;
  children: Child;
  flash?: string | null;
  error?: string | null;
  path?: string;
}> = ({ title, user, children, flash, error, path = "/admin" }) => {
  return (
    <Layout title={`${title} · Admin TOKENIZER`}>
      <div class="min-h-screen bg-background text-foreground">
        {user ? (
          <div class="flex min-h-screen">
            {/* Desktop sidebar */}
            <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-panel lg:flex">
              <div class="flex h-14 items-center gap-2.5 border-b border-border px-5">
                <span class="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 font-mono text-xs font-semibold text-brand">
                  T
                </span>
                <div class="min-w-0 leading-tight">
                  <div class="truncate text-sm font-semibold tracking-tight">TOKENIZER</div>
                  <div class="font-mono text-[10px] uppercase tracking-wider text-faint">Admin</div>
                </div>
              </div>
              <div class="flex-1 overflow-y-auto py-4">
                <p class="mb-2 px-5 font-mono text-[10px] uppercase tracking-wider text-faint">Menu</p>
                <NavLinks path={path} />
              </div>
              <div class="border-t border-border p-4">
                <div class="mb-3 flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold uppercase text-brand ring-1 ring-border">
                    {user.username.slice(0, 1)}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium">{user.username}</div>
                    <div class="text-xs text-muted">Operator</div>
                  </div>
                </div>
                <form method="post" action="/admin/logout">
                  <button
                    type="submit"
                    class="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    Keluar dari sesi
                  </button>
                </form>
              </div>
            </aside>

            <div class="flex min-w-0 flex-1 flex-col">
              {/* Top bar */}
              <header class="sticky top-0 z-20 border-b border-border bg-panel/90 backdrop-blur-md">
                <div class="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
                  <div class="flex items-center gap-3 lg:hidden">
                    <span class="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 font-mono text-xs font-semibold text-brand">
                      T
                    </span>
                    <span class="text-sm font-semibold">Admin</span>
                  </div>
                  <div class="hidden text-sm text-muted lg:block">
                    <span class="text-faint">Konsol operasional</span>
                    <span class="mx-2 text-border-strong">·</span>
                    <span class="font-medium text-foreground/90">{title}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      class="hidden rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground sm:inline-flex"
                    >
                      Lihat situs ↗
                    </a>
                    <form method="post" action="/admin/logout" class="lg:hidden">
                      <button
                        type="submit"
                        class="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
                {/* Mobile nav */}
                <div class="border-t border-border lg:hidden">
                  <NavLinks path={path} mobile />
                </div>
              </header>

              <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                <div class="mx-auto max-w-6xl">
                  {error ? <Alert tone="error">{error}</Alert> : null}
                  {flash ? <Alert tone="success">{flash}</Alert> : null}
                  {children}
                </div>
              </main>
            </div>
          </div>
        ) : (
          <main class="min-h-screen">{children}</main>
        )}
      </div>
    </Layout>
  );
};
