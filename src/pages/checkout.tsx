import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { IconCheck } from "../components/icons";
import type { Plan } from "../lib/plans";

export type FormValues = {
  email: string;
  discordId: string;
  whatsapp: string;
  telegram: string;
};

export type CheckoutError = { field?: string; message: string };

const Input: FC<{
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  error?: string;
}> = ({ name, label, type = "text", required, value = "", placeholder, error }) => (
  <div>
    <label class="block text-sm font-medium text-foreground" for={name}>
      {label}
      {required ? <span class="text-brand"> *</span> : null}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      class={`mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand ${
        error ? "border-red-500" : "border-border"
      }`}
    />
    {error ? <p class="mt-1 text-xs text-red-400">{error}</p> : null}
  </div>
);

export const CheckoutPage: FC<{
  plan: Plan;
  values?: Partial<FormValues>;
  errors?: CheckoutError[];
  captchaSiteKey: string;
  captchaBypass?: boolean;
}> = ({ plan, values = {}, errors = [], captchaSiteKey, captchaBypass = false }) => {
  const errFor = (field: string) => errors.find((e) => e.field === field)?.message;
  const general = errors.filter((e) => !e.field);

  return (
    <Layout
      title={`Checkout ${plan.name} — ${content.brand}`}
      description={`Pembelian paket ${plan.name} token.`}
      headExtra={
        captchaBypass || !captchaSiteKey ? null : (
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        )
      }
    >
      <Navbar />
      <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Checkout</h1>
            <p class="mt-2 text-sm text-muted">Isi data di bawah untuk membuat invoice pembayaran.</p>
            <p class="mt-1 text-xs text-faint">
              API key dikirim ke email (utama). Discord / WhatsApp / Telegram opsional untuk notifikasi.
            </p>

            {general.length > 0 ? (
              <ul class="mt-4 space-y-1 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {general.map((e) => (
                  <li>{e.message}</li>
                ))}
              </ul>
            ) : null}

            <form method="post" action="/checkout" class="mt-6 space-y-4">
              <input type="hidden" name="plan" value={plan.id} />
              <Input
                name="email"
                label="Email"
                type="email"
                required
                value={values.email ?? ""}
                placeholder="anda@email.com"
                error={errFor("email")}
              />
              <Input
                name="discordId"
                label="Discord ID"
                value={values.discordId ?? ""}
                placeholder="username (opsional)"
                error={errFor("discordId")}
              />
              <Input
                name="whatsapp"
                label="WhatsApp"
                value={values.whatsapp ?? ""}
                placeholder="08xxxx (opsional)"
                error={errFor("whatsapp")}
              />
              <Input
                name="telegram"
                label="Telegram"
                value={values.telegram ?? ""}
                placeholder="@username (opsional)"
                error={errFor("telegram")}
              />

              {captchaBypass || !captchaSiteKey ? null : (
                <div>
                  <div class="cf-turnstile" data-sitekey={captchaSiteKey} data-theme="dark"></div>
                  {errFor("captcha") ? (
                    <p class="mt-1 text-xs text-red-400">{errFor("captcha")}</p>
                  ) : null}
                </div>
              )}

              <button
                type="submit"
                class="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
              >
                Bayar sekarang
              </button>
            </form>
          </section>

          <aside class="h-fit rounded-lg border border-border bg-panel p-6">
            <p class="font-mono text-xs uppercase tracking-wider text-faint">Ringkasan paket</p>
            <h2 class="mt-2 text-2xl font-semibold text-foreground">{plan.name}</h2>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">{plan.priceLabel}</p>
            <ul class="mt-6 space-y-2.5 text-sm text-muted">
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Kuota {plan.tokens}
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Masa aktif {plan.duration}
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Akses multi-model frontier
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> API kompatibel OpenAI
              </li>
            </ul>
            <p class="mt-6 text-xs text-faint">{content.pricing.note}</p>
          </aside>
        </div>
      </main>
      <Footer />
    </Layout>
  );
};
