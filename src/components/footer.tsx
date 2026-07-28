import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { LogoMark, IconBrandX, IconBrandGithub, IconBrandDiscord } from "./icons";

const SOCIAL_ICONS = { x: IconBrandX, github: IconBrandGithub, discord: IconBrandDiscord } as const;

export const Footer: FC = () => {
  const f = content.footer;
  return (
    <footer class="border-t border-border">
      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div class="flex flex-col items-center text-center">
          <a href="/" class="flex items-center gap-2.5">
            <LogoMark size={20} />
            <span class="text-sm font-semibold tracking-tight">{content.brand}</span>
          </a>
          <p class="mt-3 max-w-sm text-sm text-muted">{content.tagline}</p>
          <div class="mt-4 flex items-center gap-4">
            {f.socials.map((s) => {
              const Icon = SOCIAL_ICONS[s.icon as keyof typeof SOCIAL_ICONS];
              return (
                <a
                  href={s.href}
                  aria-label={s.label}
                  class="text-faint transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>
        <div class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p class="text-xs text-faint">{f.copyright}</p>
          <nav class="flex items-center gap-6" aria-label="Navigasi legal">
            {f.legal.map((l) => (
              <a href={l.href} class="text-xs text-faint transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};
