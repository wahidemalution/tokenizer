import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { IconArrowRight, IconCopy } from "./icons";

export const FinalCta: FC = () => {
  const c = content.finalCta;
  return (
    <section class="relative overflow-hidden">
      <div
        class="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(ellipse_50%_100%_at_50%_100%,rgba(62,207,142,0.06),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <div data-reveal>
          <h2 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{c.title}</h2>
          <p class="mt-3 text-muted">{c.sub}</p>
          <div class="mt-8 inline-flex items-center gap-3 rounded-md border border-border bg-panel px-4 py-2.5">
            <code class="font-mono text-sm text-muted">
              <span class="text-brand">$</span> {c.codeChip}
            </code>
            <button
              type="button"
              class="text-faint transition-colors hover:text-foreground"
              aria-label="Salin perintah"
              data-copy={c.codeChip}
              data-copy-label="Salin"
            >
              <IconCopy size={14} />
            </button>
          </div>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={c.primaryCta.href}
              class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
            >
              {c.primaryCta.label}
              <IconArrowRight size={15} />
            </a>
            <a
              href={c.secondaryCta.href}
              class="inline-flex h-11 items-center justify-center rounded-md border border-border bg-panel px-6 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              {c.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
