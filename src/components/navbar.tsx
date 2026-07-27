import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { LogoMark, IconMenu } from "./icons";

export const Navbar: FC = () => {
  const nav = content.nav;
  return (
    <header class="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/" class="flex items-center gap-2.5">
          <LogoMark size={20} />
          <span class="text-sm font-semibold tracking-tight">{content.brand}</span>
        </a>
        <nav class="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
          {nav.links.map((l) => (
            <a href={l.href} class="text-sm text-muted transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div class="hidden md:block">
          <a
            href={nav.cta.href}
            class="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
          >
            {nav.cta.label}
          </a>
        </div>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted md:hidden"
          aria-expanded="false"
          aria-label="Buka menu"
          data-mobile-toggle
        >
          <IconMenu size={18} />
        </button>
      </div>
      <div class="hidden border-t border-border md:hidden" data-mobile-menu>
        <nav class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label="Navigasi mobile">
          {nav.links.map((l) => (
            <a href={l.href} class="rounded-md px-2 py-2 text-sm text-muted hover:bg-panel hover:text-foreground">
              {l.label}
            </a>
          ))}
          <a
            href={nav.cta.href}
            class="mt-1 inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-black"
          >
            {nav.cta.label}
          </a>
        </nav>
      </div>
    </header>
  );
};
