import type { FC } from "hono/jsx";
import { content } from "../content/home";

export const LogoStrip: FC = () => {
  const s = content.logoStrip;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p class="text-center font-mono text-xs tracking-widest text-faint">{s.label}</p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {s.wordmarks.map((w) => (
            <span class="text-lg font-semibold tracking-tight text-faint transition-colors hover:text-muted">
              {w}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
