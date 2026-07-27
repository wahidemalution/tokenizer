import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconCheck, IconX } from "./icons";

export const Comparison: FC = () => {
  const cmp = content.comparison;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{cmp.label}</SectionLabel>
        </div>
        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-border bg-panel p-6" data-reveal>
            <h3 class="font-medium text-muted">{cmp.without.title}</h3>
            <ul class="mt-4 space-y-3">
              {cmp.without.points.map((p) => (
                <li class="flex items-start gap-2.5 text-sm text-muted">
                  <IconX size={15} class="mt-0.5 shrink-0 text-red-400/70" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div class="rounded-lg border border-brand/25 bg-brand/[0.04] p-6" data-reveal>
            <h3 class="font-medium text-foreground">{cmp.with.title}</h3>
            <ul class="mt-4 space-y-3">
              {cmp.with.points.map((p) => (
                <li class="flex items-start gap-2.5 text-sm text-foreground">
                  <IconCheck size={15} class="mt-0.5 shrink-0 text-brand" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
