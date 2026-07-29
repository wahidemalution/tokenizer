import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

const ERROR_MSG: Record<string, string> = {
  auth: "Username atau password salah.",
  rate: "Terlalu banyak percobaan. Coba lagi nanti.",
};

export const LoginPage: FC<{ error?: string | null; next?: string }> = ({ error, next }) => {
  const errText = error ? ERROR_MSG[error] ?? "Login gagal." : null;
  return (
    <AdminLayout title="Login" error={errText}>
      <div class="mx-auto max-w-sm">
        <h1 class="text-xl font-semibold">Login admin</h1>
        <p class="mt-1 text-sm text-muted">Masuk untuk mengelola order TOKENIZER.</p>
        <form method="post" action="/admin/login" class="mt-6 space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div>
            <label class="block text-xs text-muted" for="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              autocomplete="username"
              required
              class="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs text-muted" for="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-background hover:bg-brand-strong"
          >
            Masuk
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};
