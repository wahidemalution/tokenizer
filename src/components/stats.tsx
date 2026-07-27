import type { FC } from "hono/jsx";
import { content } from "../content/home";

export const Stats: FC = () => {
  const s = content.stats;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div
          class="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          data-reveal
        >
          {s.items.map((it) => (
            <div class="bg-background p-6">
              <p class="text-3xl font-semibold tracking-tight text-foreground">{it.value}</p>
              <p class="mt-1 text-sm font-medium text-foreground">{it.label}</p>
              <p class="mt-1 text-sm text-muted">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
