import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconCheck } from "./icons";
import { PLANS, formatIdr, pricePerMillion } from "../lib/plans";

export const PricingCards: FC = () => {
  const p = content.pricing;
  return (
    <section id="harga" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{p.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{p.title}</h2>
          <p class="mt-2 text-muted">{p.subtitle}</p>
        </div>
        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isPopular = plan.id === p.badges.popular.planId;
            const isBest = plan.id === p.badges.bestValue.planId;
            const discountPercent = plan.id === "1m" && plan.amountIdr !== 10000 ? Math.round(((10000 - plan.amountIdr) / 10000) * 100) : null;
            const hasDiscount = discountPercent !== null;
            const highlight = isPopular || hasDiscount;
            return (
              <div
                class={`relative rounded-lg border p-5 transition-colors ${
                  highlight ? "border-brand/50 bg-panel" : "border-border bg-panel hover:border-border-strong"
                }`}
                data-reveal
              >
                {isPopular ? (
                  <span class="absolute -top-2.5 left-4 rounded bg-brand px-2 py-0.5 text-xs font-medium text-black">
                    {p.badges.popular.label}
                  </span>
                ) : null}
                {hasDiscount ? (
                  <div class="absolute -top-2.5 left-4 flex items-center gap-1.5">
                    <span class="rounded bg-brand px-2 py-0.5 text-xs font-medium text-black">
                      Diskon {discountPercent}%
                    </span>
                    <span class="rounded border border-brand/40 bg-background px-2 py-0.5 text-xs font-medium text-brand">
                      Terbatas
                    </span>
                  </div>
                ) : null}
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-foreground">{plan.name}</h3>
                  {isBest ? (
                    <span class="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted">
                      {p.badges.bestValue.label}
                    </span>
                  ) : null}
                </div>
                <p class="mt-0.5 text-sm text-muted">{plan.tokens}</p>
                <div class="mt-4 flex items-end gap-2">
                  {plan.id === "1m" && plan.amountIdr !== 10000 ? (
                    <span class="text-sm text-faint line-through">Rp10.000</span>
                  ) : null}
                  <p class="text-2xl font-semibold tracking-tight text-foreground">{plan.priceLabel}</p>
                </div>
                <ul class="mt-4 space-y-2 text-sm text-muted">
                  <li class="flex items-center gap-2">
                    <IconCheck size={14} class="text-brand" />
                    {p.durationLabel} {plan.duration}
                  </li>
                  <li class="flex items-center gap-2">
                    <IconCheck size={14} class="text-brand" />
                    {formatIdr(pricePerMillion(plan))} {p.perMillion}
                  </li>
                </ul>
                <a
                  href={`/checkout?plan=${plan.id}`}
                  class={`mt-5 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    highlight
                      ? "bg-brand text-black hover:bg-brand-strong"
                      : "border border-border bg-background text-foreground hover:bg-elevated"
                  }`}
                >
                  {p.ctaLabel}
                </a>
              </div>
            );
          })}
        </div>
        <p class="mt-4 text-xs text-faint">{p.note}</p>
      </div>
    </section>
  );
};
