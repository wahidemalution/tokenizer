import type { FC } from "hono/jsx";

export const SectionLabel: FC<{ children: string }> = ({ children }) => (
  <p class="font-mono text-sm text-faint">
    <span class="text-brand">//</span> {children}
  </p>
);
