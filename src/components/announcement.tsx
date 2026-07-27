import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { IconArrowRight } from "./icons";

export const Announcement: FC = () => {
  const a = content.announcement;
  return (
    <div class="border-b border-border bg-panel/60">
      <div class="mx-auto flex max-w-6xl items-center justify-center px-4 py-2 sm:px-6">
        <a
          href={a.href}
          class="group inline-flex items-center gap-2.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
          <span>{a.text}</span>
          <IconArrowRight size={12} class="text-faint transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
};
