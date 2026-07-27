import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";

export const Models: FC = () => {
  const m = content.models;
  return (
    <section id="model" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{m.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{m.title}</h2>
          <p class="mt-2 max-w-xl text-muted">{m.subtitle}</p>
        </div>
        <div class="mt-10 overflow-x-auto rounded-lg border border-border" data-reveal>
          <table class="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr class="border-b border-border bg-panel">
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Model</th>
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Provider</th>
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Tier</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {m.items.map((it) => (
                <tr class="transition-colors hover:bg-panel/60">
                  <td class="px-4 py-3 font-medium text-foreground">{it.name}</td>
                  <td class="px-4 py-3 font-mono text-[13px] text-muted">{it.provider}</td>
                  <td class="px-4 py-3">
                    {it.tier === "Free" ? (
                      <span class="inline-block rounded border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand">
                        Free
                      </span>
                    ) : (
                      <span class="inline-block rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted">
                        Pro
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-faint">{m.note}</p>
      </div>
    </section>
  );
};
