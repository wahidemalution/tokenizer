import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { MODEL_STATUS_META, type Model, type ModelStatus } from "../lib/models";

const STATUS_BADGE_CLASS: Record<ModelStatus, string> = {
  available: "bg-brand/15 text-brand ring-1 ring-inset ring-brand/25",
  maintenance: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  error: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/25",
  "coming-soon": "bg-elevated text-muted ring-1 ring-inset ring-border",
};

export const Models: FC<{ models: Model[] }> = ({ models }) => {
  const m = content.models;
  return (
    <section id="model" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{m.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{m.title}</h2>
          <p class="mt-2 max-w-xl text-muted">{m.subtitle}</p>
        </div>
        {models.length === 0 ? (
          <p class="mt-10 text-sm text-faint">Daftar model belum tersedia.</p>
        ) : (
          <div class="mt-10 overflow-x-auto rounded-lg border border-border" data-reveal>
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr class="border-b border-border bg-panel">
                  <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Model</th>
                  <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Provider</th>
                  <th scope="col" class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {models.map((it) => {
                  const meta = MODEL_STATUS_META[it.status];
                  return (
                    <tr class="transition-colors hover:bg-panel/60">
                      <td class="px-4 py-3 font-medium text-foreground">{it.name}</td>
                      <td class="px-4 py-3 font-mono text-[13px] text-muted">{it.provider}</td>
                      <td class="px-4 py-3">
                        <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[it.status]}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p class="mt-3 text-xs text-faint">{m.note}</p>
      </div>
    </section>
  );
};
