import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconChevronDown } from "./icons";

export const Faq: FC = () => {
  const f = content.faq;
  return (
    <section id="faq" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{f.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{f.title}</h2>
        </div>
        <div class="mt-8 rounded-lg border border-border" data-reveal>
          {f.items.map((it, i) => (
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
  );
};
