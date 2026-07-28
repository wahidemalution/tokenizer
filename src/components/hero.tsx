import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconArrowRight } from "./icons";

type Seg = { t: string; c?: string };
const STR = "text-brand";
const KW = "text-foreground";

// Snippet Python OpenAI-compatible — string ditint hijau, keyword lebih terang, sisanya mono.
const CODE_LINES: Seg[][] = [
  [{ t: "from", c: KW }, { t: " openai " }, { t: "import", c: KW }, { t: " OpenAI" }],
  [],
  [{ t: "client = OpenAI(" }],
  [{ t: "  base_url=" }, { t: '"https://api.tokenizer.com/v1"', c: STR }, { t: "," }],
  [{ t: "  api_key=" }, { t: '"tk-your-key"', c: STR }, { t: "," }],
  [{ t: ")" }],
  [],
  [{ t: "r = client.chat.completions.create(" }],
  [{ t: "  model=" }, { t: '"claude-opus-4.7"', c: STR }, { t: "," }],
  [
    { t: "  messages=[{" },
    { t: '"role"', c: STR },
    { t: ": " },
    { t: '"user"', c: STR },
    { t: ", " },
    { t: '"content"', c: STR },
    { t: ": " },
    { t: '"Hi"', c: STR },
    { t: "}]" },
  ],
  [{ t: ")" }],
];

const CodeWindow: FC = () => (
  <div class="overflow-hidden rounded-lg border border-border bg-panel shadow-2xl shadow-black/40">
    <div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <span class="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
      <span class="font-mono text-xs text-faint">{content.hero.codeFile}</span>
    </div>
    <pre class="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-muted">
      <code>
        {CODE_LINES.map((line) => (
          <span class="block">
            {line.length === 0 ? " " : line.map((s) => <span class={s.c}>{s.t}</span>)}
          </span>
        ))}
      </code>
    </pre>
  </div>
);

export const Hero: FC = () => {
  const h = content.hero;
  return (
    <section class="relative overflow-hidden border-b border-border">
      <div
        class="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div
        class="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(62,207,142,0.07),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div data-reveal>
            <SectionLabel>{h.label}</SectionLabel>
            <h1 class="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              {h.h1Line1}
              <br />
              <span class="text-foreground">{h.h1Line2}</span>
            </h1>
            <p class="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">{h.sub}</p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={h.primaryCta.href}
                class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
              >
                {h.primaryCta.label}
                <IconArrowRight size={15} />
              </a>
              <a
                href={h.secondaryCta.href}
                class="inline-flex h-11 items-center justify-center rounded-md border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
              >
                {h.secondaryCta.label}
              </a>
            </div>
          </div>
          <div data-reveal>
            <CodeWindow />
          </div>
        </div>
      </div>
    </section>
  );
};
