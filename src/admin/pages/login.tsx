import type { FC } from "hono/jsx";
import { adminUrl } from "../../lib/admin-url";
import { AdminLayout } from "../layout";
import { Alert, Btn, CsrfField, Field, inputClass } from "../ui";

const ERROR_MSG: Record<string, string> = {
  auth: "Username atau password salah.",
  rate: "Terlalu banyak percobaan. Coba lagi nanti.",
};

export const LoginPage: FC<{ error?: string | null; next?: string; csrfToken: string }> = ({
  error,
  next,
  csrfToken,
}) => {
  const errText = error ? (ERROR_MSG[error] ?? "Login gagal.") : null;
  return (
    <AdminLayout title="Login">
      <div class="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div class="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(62,207,142,0.08),transparent_55%)]" />

        <div class="relative w-full max-w-md">
          <div class="mb-8 text-center">
            <div class="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 font-mono text-sm font-semibold text-brand ring-1 ring-brand/25">
              T
            </div>
            <h1 class="text-2xl font-semibold tracking-tight">TOKENIZER Admin</h1>
            <p class="mt-1.5 text-sm text-muted">Masuk untuk mengelola order dan fulfillment.</p>
          </div>

          <div class="rounded-2xl border border-border bg-panel/90 p-6 shadow-xl shadow-black/40 backdrop-blur sm:p-8">
            {errText ? <Alert tone="error">{errText}</Alert> : null}

            <form method="post" action={adminUrl("/login")} class="space-y-4">
              <CsrfField token={csrfToken} />
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <Field label="Username" name="username">
                <input
                  id="username"
                  name="username"
                  autocomplete="username"
                  required
                  autofocus
                  class={inputClass}
                  placeholder="admin"
                />
              </Field>
              <Field label="Password" name="password">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Btn type="submit" variant="primary" class="w-full">
                Masuk ke dashboard
              </Btn>
            </form>
          </div>

          <p class="mt-6 text-center text-xs text-faint">
            Akses terbatas untuk operator internal.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};
