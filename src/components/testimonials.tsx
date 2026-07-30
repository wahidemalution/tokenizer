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
        <div class="mt-10 flex min-h-[12rem] items-center justify-center" data-reveal>
          <p class="cursor-default text-center text-lg font-medium text-faint transition-all duration-300 hover:scale-105 hover:text-brand sm:text-xl">
            Menunggu Review Kamu.
          </p>
        </div>
      </div>
    </section>
  );
};
