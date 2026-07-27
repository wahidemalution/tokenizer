import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";

export const Testimonials: FC = () => {
  const t = content.testimonials;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{t.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t.title}</h2>
        </div>
        <div class="mt-10 grid gap-4 md:grid-cols-2">
          {t.items.map((it) => (
            <figure class="flex flex-col justify-between rounded-lg border border-border bg-panel p-6" data-reveal>
              <blockquote class="text-[15px] leading-relaxed text-foreground">"{it.quote}"</blockquote>
              <figcaption class="mt-6 flex items-center gap-3">
                <img
                  src={it.avatar}
                  alt={it.name}
                  width={36}
                  height={36}
                  class="h-9 w-9 rounded-full border border-border"
                  loading="lazy"
                />
                <div>
                  <p class="text-sm font-medium text-foreground">{it.name}</p>
                  <p class="text-xs text-faint">{it.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
