import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { PricingCards } from "../components/pricing-cards";
import { SectionLabel } from "../components/section-label";
import { IconChevronDown } from "../components/icons";
import { PLANS, formatIdr, pricePerMillion } from "../lib/plans";

const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Kenapa harga bisa berubah?",
    a: "Harga token mengikuti harga dari provider. Jika provider menaikkan atau menurunkan harga, paket menyesuaikan — kuota yang sudah Anda beli tetap berlaku.",
  },
  {
    q: "Bagaimana cara membayar?",
    a: "Pembayaran via QRIS atau e-wallet melalui bayar.gg. API key dikirim ke email Anda setelah pembayaran terkonfirmasi.",
  },
  {
    q: "Apakah bisa top-up?",
    a: "Bisa. Beli paket baru kapan saja — kuota langsung ditambahkan ke akun Anda.",
  },
];

export const PricingPage: FC = () => {
  const p = content.pricing;
  return (
    <Layout title={`Harga — ${content.brand}`} description={p.subtitle}>
      <Navbar />
      <main>
        <section class="border-b border-border">
          <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <SectionLabel>{p.label}</SectionLabel>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{p.title}</h1>
            <p class="mt-2 max-w-xl text-muted">{p.subtitle}</p>
          </div>
        </section>

        <PricingCards />

        <section class="border-b border-border">
          <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div data-reveal>
              <SectionLabel>perbandingan paket</SectionLabel>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Bandingkan paket
              </h2>
            </div>
            <div class="mt-10 overflow-x-auto rounded-lg border border-border" data-reveal>
              <table class="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr class="border-b border-border bg-panel">
                    <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Paket</th>
                    <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Kuota</th>
                    <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Harga</th>
                    <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">per 1M token</th>
                    <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Masa aktif</th>
                    <th scope="col" class="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  {PLANS.map((plan) => (
                    <tr class="transition-colors hover:bg-panel/60">
                      <td class="px-4 py-3 font-medium text-foreground">
                        {plan.name}
                        {plan.id === p.badges.popular.planId ? (
                          <span class="ml-2 rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-black">
                            {p.badges.popular.label}
                          </span>
                        ) : null}
                      </td>
                      <td class="px-4 py-3 text-muted">{plan.tokens}</td>
                      <td class="px-4 py-3 text-foreground">{plan.priceLabel}</td>
                      <td class="px-4 py-3 font-mono text-[13px] text-muted">
                        {formatIdr(pricePerMillion(plan))}
                      </td>
                      <td class="px-4 py-3 text-muted">{plan.duration}</td>
                      <td class="px-4 py-3 text-right">
                        <a
                          href={`/checkout?plan=${plan.id}`}
                          class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
                        >
                          Pilih
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="mt-3 text-xs text-faint">{p.note}</p>
          </div>
        </section>

        <section>
          <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <div data-reveal>
              <SectionLabel>faq harga</SectionLabel>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Pertanyaan seputar harga
              </h2>
            </div>
            <div class="mt-8 rounded-lg border border-border" data-reveal>
              {PRICING_FAQ.map((it, i) => (
                <details class={`group ${i > 0 ? "border-t border-border" : ""}`}>
                  <summary class="faq-summary flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:text-brand">
                    {it.q}
                    <IconChevronDown size={16} class="shrink-0 text-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <p class="px-5 pb-5 text-sm leading-relaxed text-muted">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Layout>
  );
};
