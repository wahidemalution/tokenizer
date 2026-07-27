import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { LogoMark, IconBrandX, IconBrandGithub, IconBrandDiscord } from "./icons";

const SOCIAL_ICONS = { x: IconBrandX, github: IconBrandGithub, discord: IconBrandDiscord } as const;

export const Footer: FC = () => {
  const f = content.footer;
  return (
    <footer class="border-t border-border">
      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div class="flex flex-col justify-between gap-8 md:flex-row">
          <div class="max-w-xs">
            <a href="/" class="flex items-center gap-2.5">
              <LogoMark size={20} />
              <span class="text-sm font-semibold tracking-tight">{content.brand}</span>
            </a>
            <p class="mt-3 text-sm text-muted">{content.tagline}</p>
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
          <nav class="flex gap-16" aria-label="Navigasi footer">
            {f.columns.map((col) => (
              <div>
                <p class="font-mono text-xs uppercase tracking-wider text-faint">{col.title}</p>
                <ul class="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li>
                      <a href={l.href} class="text-sm text-muted transition-colors hover:text-foreground">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p class="mt-10 border-t border-border pt-6 text-xs text-faint">{f.copyright}</p>
      </div>
    </footer>
  );
};
