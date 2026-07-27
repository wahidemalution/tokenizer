import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconArrowRight } from "./icons";

export const Features: FC = () => {
  const f = content.features;
  return (
    <section id="fitur" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{f.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{f.title}</h2>
          <p class="mt-2 text-muted">{f.subtitle}</p>
        </div>
        <div
          class="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
          data-reveal
        >
          {f.items.map((item) => (
            <div class="bg-background p-6">
              <p class="font-mono text-xs text-faint">{item.n}</p>
              <h3 class="mt-3 font-medium text-foreground">{item.title}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
          <a
            href={f.cta.href}
            class="group flex items-center justify-between gap-4 bg-panel p-6 transition-colors hover:bg-elevated"
          >
            <span class="text-sm font-medium text-foreground">{f.cta.label}</span>
            <IconArrowRight size={16} class="text-brand transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};
