import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { PROVIDER_LOGOS } from "./provider-logos";

export const LogoStrip: FC = () => {
  const s = content.logoStrip;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p class="text-center font-mono text-xs tracking-widest text-faint">{s.label}</p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-10">
          {s.providers.map((p) => {
            const entry = PROVIDER_LOGOS[p.slug];
            if (!entry) return null;
            const { Icon, colored } = entry;
            return (
              <span title={p.name} aria-label={p.name} role="img" class="inline-flex">
                <Icon
                  size={32}
                  class={
                    colored
                      ? "opacity-60 transition-all duration-200 hover:scale-110 hover:opacity-100"
                      : "text-faint transition-all duration-200 hover:scale-110 hover:text-foreground"
                  }
                />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
};
