# TOKENIZER Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun landing page TOKENIZER (home + pricing + checkout fungsional penuh) dengan Bun + Hono SSR, gaya Supabase dark mode, copy full Bahasa Indonesia, di project kosong `/home/wahid/landing-page-kimi`.

**Architecture:** SSR via `hono/jsx` + `renderToString`. Konten sebagai data terpusat di `src/content/home.ts`. Backend checkout di-port dari referensi `/home/wahid/landing-page` (bayar.gg, SQLite `bun:sqlite`, Turnstile, Discord webhook, rate limit). Styling Tailwind CSS v4 dengan token Supabase-dark di `@theme`.

**Tech Stack:** Bun, Hono ^4.6 (`hono/jsx`), Tailwind CSS v4 (`@tailwindcss/cli`), `bun:sqlite`, `bun:test`.

**Spec:** `docs/superpowers/specs/2026-07-27-tokenizer-landing-design.md`

## Global Constraints

- Working directory untuk SEMUA perintah: `/home/wahid/landing-page-kimi`
- Runtime dependency HANYA `hono`. Dev deps: `tailwindcss`, `@tailwindcss/cli`, `typescript`, `@types/bun`. Tidak ada dep lain.
- Semua copy UI dalam **Bahasa Indonesia**; kode, identifier, dan snippet code dalam English.
- Anti-slop: tanpa gradient ungu/biru, tanpa teks gradient, tanpa glassmorphism berlebihan, tanpa emoji di UI, tanpa ilustrasi stok. Aksen hijau `#3ECF8E` dipakai hemat.
- Nama env PERSIS: `PUBLIC_BASE_URL`, `BAYAR_GG_API_KEY`, `BAYAR_GG_BASE_URL`, `BAYAR_GG_PAYMENT_URL`, `BAYAR_GG_PAYMENT_METHOD`, `DISCORD_WEBHOOK_URL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_BYPASS`, `BUN_DB_PATH`, `PORT`.
- TDD untuk semua `src/lib/*`: test dulu, lihat gagal, implementasi, lihat lulus.
- Commit setiap akhir task. Git identity repo-lokal sudah diset di Task 1.
- Jangan sentuh folder `/home/wahid/landing-page` (referensi read-only).

---

### Task 1: Scaffold project + design tokens

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/styles/app.css`
- Create: `src/server.tsx`
- Create: `src/index.tsx`
- Create: `public/favicon.svg`

**Interfaces:**
- Consumes: —
- Produces: `Layout` FC dari `src/server.tsx` (dipakai semua pages); script `dev`, `build`, `build:css`, `build:client`, `start`; token warna Tailwind `background`, `panel`, `elevated`, `border`, `border-strong`, `foreground`, `muted`, `faint`, `brand`, `brand-strong` + font `sans`, `mono` (dipakai semua komponen).

- [ ] **Step 1: Set git identity repo-lokal (agar commit berikutnya bersih)**

```bash
git config user.name "wahid" && git config user.email "wahid@tokenizerid.local"
```

- [ ] **Step 2: Buat `package.json`**

```json
{
  "name": "tokenizer-landing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.tsx",
    "build:css": "tailwindcss -i ./src/styles/app.css -o ./public/app.css --minify",
    "build:client": "bun build src/client/main.ts --outfile public/client.js --minify",
    "build": "bun run build:css && bun run build:client",
    "start": "bun src/index.tsx",
    "test": "bun test"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "@types/bun": "latest",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Buat `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Buat `.gitignore`**

```
node_modules/
public/app.css
public/client.js
data/
.env
dist/
*.log
.DS_Store
```

- [ ] **Step 5: Buat `.env.example`**

```
# Public site base URL (tanpa trailing slash). Dipakai untuk callback_url dan redirect_url.
PUBLIC_BASE_URL=http://localhost:3000

# bayar.gg — ambil dari dashboard: https://www.bayar.gg/dashboard
BAYAR_GG_API_KEY=
BAYAR_GG_BASE_URL=https://www.bayar.gg/api
BAYAR_GG_PAYMENT_URL=https://www.bayar.gg/pay
BAYAR_GG_PAYMENT_METHOD=qris

# Discord webhook URL untuk notifikasi order lunas
DISCORD_WEBHOOK_URL=

# Cloudflare Turnstile — https://dash.cloudflare.com/?to=/:account/turnstile
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
# Isi 1 hanya untuk dev lokal agar captcha di-skip (default mati)
TURNSTILE_BYPASS=

# Opsional: override path SQLite (default: data/orders.sqlite)
BUN_DB_PATH=

# Opsional: port server (default: 3000)
PORT=
```

- [ ] **Step 6: Buat `src/styles/app.css` (design tokens Supabase-dark)**

```css
@import "tailwindcss";

@theme {
  --color-background: #0c0c0c;
  --color-panel: #121212;
  --color-elevated: #1b1b1b;
  --color-border: #242424;
  --color-border-strong: #363636;
  --color-foreground: #ededed;
  --color-muted: #a1a1a1;
  --color-faint: #6e6e6e;
  --color-brand: #3ecf8e;
  --color-brand-strong: #57d9a3;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  html {
    color-scheme: dark;
    scroll-behavior: smooth;
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
  }
  ::selection {
    background-color: var(--color-brand);
    color: #0c0c0c;
  }
  * {
    border-color: var(--color-border);
  }
  :focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }
}

@layer components {
  /* Garis grid hairline khas Supabase — dipakai di hero */
  .bg-grid {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 56px 56px;
  }
  /* Sembunyikan marker bawaan <summary> pada FAQ */
  .faq-summary {
    list-style: none;
  }
  .faq-summary::-webkit-details-marker {
    display: none;
  }
  .faq-summary::marker {
    content: "";
    display: none;
  }
}

@layer utilities {
  [data-reveal] {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  [data-reveal].reveal-in {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 7: Buat `src/server.tsx` (Layout)**

```tsx
import type { FC, Child } from "hono/jsx";

export const Layout: FC<{
  title: string;
  description?: string;
  headExtra?: Child;
  children: Child;
}> = ({ title, description, headExtra, children }) => {
  return (
    <html lang="id" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c0c0c" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/app.css" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {headExtra}
      </head>
      <body class="bg-background text-foreground font-sans antialiased">
        {children}
        <script src="/client.js" defer></script>
      </body>
    </html>
  );
};
```

- [ ] **Step 8: Buat `src/index.tsx` (server minimal, route menyusul di task berikutnya)**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { mkdirSync } from "node:fs";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 9: Buat `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#3ecf8e"/><path d="M9 11h14v3.4h-5.3V23h-3.4v-8.6H9z" fill="#0c0c0c"/></svg>
```

- [ ] **Step 10: Buat stub `src/client/main.ts` (diisi penuh di Task 7)**

```ts
// Interaksi client progresif — diisi di Task 7.
export {};
```

- [ ] **Step 11: Install deps + build**

Run: `bun install && bun run build`
Expected: install sukses; `public/app.css` dan `public/client.js` terbuat tanpa error.

- [ ] **Step 12: Smoke test server**

Run: `bun src/index.tsx & sleep 1 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ && curl -s -o /dev/null -w " %{http_code}\n" http://localhost:3000/app.css; kill %1`
Expected: `404 200` (route `/` belum ada → 404 styled; css tersaji 200).

- [ ] **Step 13: Commit**

```bash
git add -A && git commit -m "feat: scaffold Bun + Hono project dengan design tokens Supabase-dark"
```

---

### Task 2: Libs murni — plans, validate, rate-limit (TDD)

**Files:**
- Create: `src/lib/plans.ts`
- Create: `src/lib/plans.test.ts`
- Create: `src/lib/validate.ts`
- Create: `src/lib/validate.test.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/rate-limit.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type Plan = { id: string; name: string; tokens: string; amountIdr: number; priceLabel: string; duration: string }`
  - `PLANS: Plan[]` (6 paket), `PLAN_IDS: string[]`, `getPlan(id: string): Plan | null`
  - `formatIdr(n: number): string` (mis. `formatIdr(40000)` → `"Rp40.000"`)
  - `planMillions(plan: Plan): number`, `pricePerMillion(plan: Plan): number`
  - `isValidEmail(s: string): boolean`, `normalizeEmail(s: string): string`, `normalizePhone(s: string): string | null`
  - `rateLimitOk(ip: string): boolean`

- [ ] **Step 1: Tulis test gagal `src/lib/plans.test.ts`**

```ts
import { test, expect } from "bun:test";
import { getPlan, PLANS, PLAN_IDS, formatIdr, planMillions, pricePerMillion } from "./plans";

test("getPlan returns the 10m plan with correct amount", () => {
  const plan = getPlan("10m");
  expect(plan).not.toBeNull();
  expect(plan!.name).toBe("10M");
  expect(plan!.amountIdr).toBe(40000);
  expect(plan!.tokens).toBe("10M token");
  expect(plan!.duration).toBe("7 hari");
});

test("getPlan returns null for unknown id", () => {
  expect(getPlan("999m")).toBeNull();
  expect(getPlan("")).toBeNull();
});

test("PLANS has 6 entries with unique ids", () => {
  expect(PLANS).toHaveLength(6);
  const ids = PLANS.map((p) => p.id);
  expect(new Set(ids).size).toBe(6);
});

test("PLAN_IDS includes 1m and 100m", () => {
  expect(PLAN_IDS).toContain("1m");
  expect(PLAN_IDS).toContain("100m");
});

test("1m plan amount is 10000 and 100m is 300000", () => {
  expect(getPlan("1m")!.amountIdr).toBe(10000);
  expect(getPlan("100m")!.amountIdr).toBe(300000);
});

test("formatIdr formats with dot thousand separators", () => {
  expect(formatIdr(10000)).toBe("Rp10.000");
  expect(formatIdr(40000)).toBe("Rp40.000");
  expect(formatIdr(300000)).toBe("Rp300.000");
});

test("planMillions parses numeric prefix of plan name", () => {
  expect(planMillions(getPlan("1m")!)).toBe(1);
  expect(planMillions(getPlan("100m")!)).toBe(100);
});

test("pricePerMillion decreases on bigger plans", () => {
  expect(pricePerMillion(getPlan("1m")!)).toBe(10000);
  expect(pricePerMillion(getPlan("10m")!)).toBe(4000);
  expect(pricePerMillion(getPlan("50m")!)).toBe(3200);
  expect(pricePerMillion(getPlan("100m")!)).toBe(3000);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `bun test src/lib/plans.test.ts`
Expected: FAIL — `Cannot find module "./plans"` atau sejenisnya.

- [ ] **Step 3: Implementasi `src/lib/plans.ts`**

```ts
export type Plan = {
  id: string;
  name: string;
  tokens: string;
  amountIdr: number;
  priceLabel: string;
  duration: string;
};

const DURATION = "7 hari";

export const PLANS: Plan[] = [
  { id: "1m", name: "1M", tokens: "1M token", amountIdr: 10000, priceLabel: "Rp10.000", duration: DURATION },
  { id: "5m", name: "5M", tokens: "5M token", amountIdr: 25000, priceLabel: "Rp25.000", duration: DURATION },
  { id: "10m", name: "10M", tokens: "10M token", amountIdr: 40000, priceLabel: "Rp40.000", duration: DURATION },
  { id: "20m", name: "20M", tokens: "20M token", amountIdr: 70000, priceLabel: "Rp70.000", duration: DURATION },
  { id: "50m", name: "50M", tokens: "50M token", amountIdr: 160000, priceLabel: "Rp160.000", duration: DURATION },
  { id: "100m", name: "100M", tokens: "100M token", amountIdr: 300000, priceLabel: "Rp300.000", duration: DURATION },
];

export const PLAN_IDS: string[] = PLANS.map((p) => p.id);

export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Format Rupiah dengan pemisah ribuan titik — tanpa bergantung pada ICU. */
export function formatIdr(n: number): string {
  return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Jutaan token dari nama paket ("10M" → 10). */
export function planMillions(plan: Plan): number {
  const m = parseInt(plan.name, 10);
  return Number.isFinite(m) && m > 0 ? m : 1;
}

/** Harga efektif per 1M token. */
export function pricePerMillion(plan: Plan): number {
  return Math.round(plan.amountIdr / planMillions(plan));
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `bun test src/lib/plans.test.ts`
Expected: 8 pass, 0 fail.

- [ ] **Step 5: Tulis test gagal `src/lib/validate.test.ts`**

```ts
import { test, expect } from "bun:test";
import { isValidEmail, normalizePhone, normalizeEmail } from "./validate";

test("isValidEmail accepts standard emails", () => {
  expect(isValidEmail("user@example.com")).toBe(true);
  expect(isValidEmail("a.b+tag@sub.domain.co")).toBe(true);
});

test("isValidEmail rejects garbage", () => {
  expect(isValidEmail("")).toBe(false);
  expect(isValidEmail("notanemail")).toBe(false);
  expect(isValidEmail("a@")).toBe(false);
  expect(isValidEmail("@b.com")).toBe(false);
  expect(isValidEmail("a @b.com")).toBe(false);
});

test("normalizePhone converts 08 to 628", () => {
  expect(normalizePhone("08123456789")).toBe("628123456789");
});

test("normalizePhone keeps 62 prefix", () => {
  expect(normalizePhone("628123456789")).toBe("628123456789");
});

test("normalizePhone strips spaces and dashes", () => {
  expect(normalizePhone("0812-345 6789")).toBe("628123456789");
});

test("normalizePhone returns null for empty or non-digits", () => {
  expect(normalizePhone("")).toBeNull();
  expect(normalizePhone("abcdef")).toBeNull();
});

test("normalizeEmail trims and lowercases", () => {
  expect(normalizeEmail("  A@B.Co ")).toBe("a@b.co");
  expect(normalizeEmail("user@Example.com")).toBe("user@example.com");
});
```

- [ ] **Step 6: Jalankan, pastikan gagal**

Run: `bun test src/lib/validate.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 7: Implementasi `src/lib/validate.ts`**

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return typeof s === "string" && EMAIL_RE.test(s.trim());
}

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export function normalizePhone(s: string): string | null {
  if (typeof s !== "string") return null;
  const digits = s.replace(/[\s\-+().]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}
```

- [ ] **Step 8: Jalankan, pastikan lulus**

Run: `bun test src/lib/validate.test.ts`
Expected: 7 pass, 0 fail.

- [ ] **Step 9: Tulis test gagal `src/lib/rate-limit.test.ts`**

```ts
import { test, expect } from "bun:test";
import { rateLimitOk } from "./rate-limit";

test("rateLimitOk allows up to 5 per minute then blocks", () => {
  const ip = "10.1.0.1";
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(true);
  expect(rateLimitOk(ip)).toBe(false);
});

test("rateLimitOk tracks empty ip under unknown bucket and eventually blocks", () => {
  for (let i = 0; i < 5; i++) {
    expect(rateLimitOk("")).toBe(true);
  }
  expect(rateLimitOk("")).toBe(false);
});

test("rateLimitOk tracks separate IPs independently", () => {
  expect(rateLimitOk("10.1.0.2")).toBe(true);
  expect(rateLimitOk("10.1.0.1")).toBe(false);
});
```

- [ ] **Step 10: Jalankan, pastikan gagal**

Run: `bun test src/lib/rate-limit.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 11: Implementasi `src/lib/rate-limit.ts`**

```ts
const windowMs = 60_000;
const maxRequests = 5;
const hits = new Map<string, number[]>();

export function rateLimitOk(ip: string): boolean {
  const key = ip || "unknown";
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= maxRequests) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
```

- [ ] **Step 12: Jalankan, pastikan lulus**

Run: `bun test src/lib/rate-limit.test.ts`
Expected: 3 pass, 0 fail.

- [ ] **Step 13: Commit**

```bash
git add src/lib/ && git commit -m "feat: tambah lib plans, validate, rate-limit beserta test"
```

---

### Task 3: test-helpers + env (TDD)

**Files:**
- Create: `src/lib/test-helpers.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/env.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `mockFetch(responses): typeof fetch` dan `withEnv(env, fn): Promise<void>` dari `test-helpers.ts` (dipakai semua test network/env)
  - `env` (getter: `baseUrl`, `bayarApiKey`, `bayarBaseUrl`, `bayarPaymentUrl`, `bayarMethod`, `discordWebhookUrl`, `turnstileSiteKey`, `turnstileSecretKey`, `turnstileBypass`)
  - `isCheckoutConfigured(): { ok: boolean; missing: string[] }`

- [ ] **Step 1: Tulis helper `src/lib/test-helpers.ts`**

```ts
export function mockFetch(
  responses: Record<string, { status?: number; body: unknown; headers?: Record<string, string> }>
): typeof fetch {
  return (async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    const entry = responses[url];
    if (!entry) {
      return new Response(JSON.stringify({ error: "no mock for " + url }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }
    const isJson = typeof entry.body === "object";
    return new Response(isJson ? JSON.stringify(entry.body) : String(entry.body ?? ""), {
      status: entry.status ?? 200,
      headers: entry.headers ?? (isJson ? { "content-type": "application/json" } : {}),
    });
  }) as typeof fetch;
}

export async function withEnv(
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void
): Promise<void> {
  const backup: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    backup[k] = Bun.env[k];
    if (env[k] === undefined) delete Bun.env[k];
    else Bun.env[k] = env[k]!;
  }
  try {
    await fn();
  } finally {
    for (const k of Object.keys(env)) {
      if (backup[k] === undefined) delete Bun.env[k];
      else Bun.env[k] = backup[k]!;
    }
  }
}
```

- [ ] **Step 2: Tulis test gagal `src/lib/env.test.ts`**

```ts
import { test, expect } from "bun:test";
import { env, isCheckoutConfigured } from "./env";
import { withEnv } from "./test-helpers";

test("env reads BAYAR_GG_API_KEY", async () => {
  await withEnv({ BAYAR_GG_API_KEY: "key123" }, () => {
    expect(env.bayarApiKey).toBe("key123");
  });
});

test("env defaults bayarBaseUrl, paymentUrl, and method", async () => {
  await withEnv({ BAYAR_GG_API_KEY: "x", BAYAR_GG_BASE_URL: undefined }, () => {
    expect(env.bayarBaseUrl).toBe("https://www.bayar.gg/api");
    expect(env.bayarPaymentUrl).toBe("https://www.bayar.gg/pay");
    expect(env.bayarMethod).toBe("qris");
  });
});

test("isCheckoutConfigured lists missing keys", async () => {
  await withEnv(
    {
      PUBLIC_BASE_URL: undefined,
      BAYAR_GG_API_KEY: undefined,
      DISCORD_WEBHOOK_URL: undefined,
      TURNSTILE_SITE_KEY: undefined,
      TURNSTILE_SECRET_KEY: undefined,
    },
    () => {
      const r = isCheckoutConfigured();
      expect(r.ok).toBe(false);
      expect(r.missing).toContain("PUBLIC_BASE_URL");
      expect(r.missing).toContain("BAYAR_GG_API_KEY");
      expect(r.missing).toContain("DISCORD_WEBHOOK_URL");
    }
  );
});

test("isCheckoutConfigured ok when all set", async () => {
  await withEnv(
    {
      PUBLIC_BASE_URL: "https://x.test",
      BAYAR_GG_API_KEY: "k",
      DISCORD_WEBHOOK_URL: "https://discord.test",
      TURNSTILE_SITE_KEY: "site",
      TURNSTILE_SECRET_KEY: "secret",
    },
    () => {
      expect(isCheckoutConfigured().ok).toBe(true);
    }
  );
});
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `bun test src/lib/env.test.ts`
Expected: FAIL — modul `./env` tidak ditemukan.

- [ ] **Step 4: Implementasi `src/lib/env.ts`**

```ts
function get(key: string): string {
  return Bun.env[key] ?? "";
}

export const env = {
  get baseUrl() {
    return get("PUBLIC_BASE_URL").replace(/\/$/, "");
  },
  get bayarApiKey() {
    return get("BAYAR_GG_API_KEY");
  },
  get bayarBaseUrl() {
    return get("BAYAR_GG_BASE_URL") || "https://www.bayar.gg/api";
  },
  get bayarPaymentUrl() {
    return get("BAYAR_GG_PAYMENT_URL") || "https://www.bayar.gg/pay";
  },
  get bayarMethod() {
    return get("BAYAR_GG_PAYMENT_METHOD") || "qris";
  },
  get discordWebhookUrl() {
    return get("DISCORD_WEBHOOK_URL");
  },
  get turnstileSiteKey() {
    return get("TURNSTILE_SITE_KEY");
  },
  get turnstileSecretKey() {
    return get("TURNSTILE_SECRET_KEY");
  },
  get turnstileBypass() {
    return get("TURNSTILE_BYPASS") === "1";
  },
};

export function isCheckoutConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!env.baseUrl) missing.push("PUBLIC_BASE_URL");
  if (!env.bayarApiKey) missing.push("BAYAR_GG_API_KEY");
  if (!env.discordWebhookUrl) missing.push("DISCORD_WEBHOOK_URL");
  if (!env.turnstileSiteKey) missing.push("TURNSTILE_SITE_KEY");
  if (!env.turnstileSecretKey) missing.push("TURNSTILE_SECRET_KEY");
  return { ok: missing.length === 0, missing };
}
```

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `bun test src/lib/env.test.ts`
Expected: 4 pass, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ && git commit -m "feat: tambah env config dan test-helpers"
```

---

### Task 4: db + orders (TDD)

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/db.test.ts`
- Create: `src/lib/orders.ts`
- Create: `src/lib/orders.test.ts`

**Interfaces:**
- Consumes: `Plan` dari `./plans`
- Produces:
  - `openDb(path: string): Database`, `migrate(db: Database): void`, `getDb(): Database`, `_resetDbForTests(path: string): Database`, `type Database`
  - `type OrderStatus = "pending" | "paid" | "expired"`, `type Order`, `type NewOrderInput`
  - `createOrder(db, input): Order`, `getOrderById(db, id): Order | null`, `getOrderByInvoice(db, invoiceId): Order | null`
  - `findReusablePending(db, email, planId): Order | null`, `expireIfDue(db, order): Order`
  - `markPaid(db, id, paidAt, finalAmountIdr): { order: Order; transitioned: boolean }`
  - `setInvoice(db, id, invoiceId, paymentUrl): void`, `setDiscordNotified(db, id): void`
  - `isPaidAmountAcceptable(orderAmountIdr, finalAmountIdr): boolean`

- [ ] **Step 1: Tulis test gagal `src/lib/db.test.ts`**

```ts
import { test, expect } from "bun:test";
import { openDb, migrate } from "./db";

test("migrate creates orders table with expected columns", () => {
  const db = openDb(":memory:");
  migrate(db);
  const cols = db.query(`PRAGMA table_info(orders)`).all() as { name: string }[];
  const names = cols.map((c) => c.name);
  expect(names).toContain("id");
  expect(names).toContain("invoice_id");
  expect(names).toContain("plan_id");
  expect(names).toContain("amount_idr");
  expect(names).toContain("status");
  expect(names).toContain("expires_at");
  expect(names).toContain("discord_notified");
});

test("migrate is idempotent", () => {
  const db = openDb(":memory:");
  migrate(db);
  migrate(db);
  const count = db.query(`SELECT count(*) as n FROM orders`).get() as { n: number };
  expect(count.n).toBe(0);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `bun test src/lib/db.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi `src/lib/db.ts`**

```ts
import { Database } from "bun:sqlite";

const MIGRATION = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  invoice_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  tokens TEXT NOT NULL,
  amount_idr INTEGER NOT NULL,
  final_amount_idr INTEGER,
  email TEXT NOT NULL,
  discord_id TEXT,
  whatsapp TEXT,
  telegram TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_url TEXT,
  paid_at TEXT,
  expires_at TEXT NOT NULL,
  discord_notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status_expires
  ON orders(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_invoice
  ON orders(invoice_id);
`;

export function openDb(path: string): Database {
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function migrate(db: Database): void {
  db.exec(MIGRATION);
}

export type { Database };

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;
  const path = Bun.env.BUN_DB_PATH || "data/orders.sqlite";
  const db = openDb(path);
  migrate(db);
  _db = db;
  return db;
}

export function _resetDbForTests(path: string): Database {
  if (_db) {
    _db.close();
    _db = null;
  }
  const db = openDb(path);
  migrate(db);
  _db = db;
  return db;
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `bun test src/lib/db.test.ts`
Expected: 2 pass, 0 fail.

- [ ] **Step 5: Tulis test gagal `src/lib/orders.test.ts`**

```ts
import { test, expect } from "bun:test";
import { _resetDbForTests } from "./db";
import {
  createOrder,
  getOrderById,
  expireIfDue,
  markPaid,
  setDiscordNotified,
  setInvoice,
  getOrderByInvoice,
  isPaidAmountAcceptable,
  findReusablePending,
} from "./orders";
import type { Plan } from "./plans";

const plan: Plan = {
  id: "10m",
  name: "10M",
  tokens: "10M token",
  amountIdr: 40000,
  priceLabel: "Rp40.000",
  duration: "7 hari",
};

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function freshDb() {
  return _resetDbForTests(":memory:");
}

test("createOrder inserts a pending order with 30m expiry", () => {
  const db = freshDb();
  const o = createOrder(db, { id: "ord-1", plan, email: "a@b.co" });
  expect(o.status).toBe("pending");
  expect(o.email).toBe("a@b.co");
  expect(o.amountIdr).toBe(40000);
  expect(o.discordNotified).toBe(false);
  const created = new Date(o.createdAt).getTime();
  const expires = new Date(o.expiresAt).getTime();
  expect(expires - created).toBeGreaterThan(29 * 60 * 1000);
  expect(expires - created).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
});

test("getOrderById retrieves inserted order", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-2", plan, email: "a@b.co" });
  const o = getOrderById(db, "ord-2");
  expect(o).not.toBeNull();
  expect(o!.id).toBe("ord-2");
});

test("expireIfDue flips pending past expires_at to expired", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-3", plan, email: "a@b.co" });
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-3");
  const after = expireIfDue(db, getOrderById(db, "ord-3")!);
  expect(after.status).toBe("expired");
});

test("expireIfDue leaves non-expired pending untouched", () => {
  const db = freshDb();
  const o = createOrder(db, { id: "ord-4", plan, email: "a@b.co" });
  const after = expireIfDue(db, o);
  expect(after.status).toBe("pending");
});

test("expireIfDue does not overwrite paid when race with concurrent markPaid", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-race", plan, email: "a@b.co" });
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-race");
  const stalePending = getOrderById(db, "ord-race")!;
  expect(stalePending.status).toBe("pending");
  markPaid(db, "ord-race", iso(0), 40123);
  const after = expireIfDue(db, stalePending);
  expect(after.status).toBe("paid");
  expect(getOrderById(db, "ord-race")!.status).toBe("paid");
});

test("isPaidAmountAcceptable allows exact and unique-code variance", () => {
  expect(isPaidAmountAcceptable(40000, 40000)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 40123)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 40999)).toBe(true);
  expect(isPaidAmountAcceptable(40000, 41000)).toBe(false);
  expect(isPaidAmountAcceptable(40000, 39999)).toBe(false);
  expect(isPaidAmountAcceptable(40000, null)).toBe(false);
  expect(isPaidAmountAcceptable(40000, undefined)).toBe(false);
});

test("markPaid sets paid status and final amount, idempotent on status", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-5", plan, email: "a@b.co" });
  const a = markPaid(db, "ord-5", iso(0), 40123);
  expect(a.order.status).toBe("paid");
  expect(a.order.finalAmountIdr).toBe(40123);
  expect(a.transitioned).toBe(true);
  const b = markPaid(db, "ord-5", iso(0), 40123);
  expect(b.order.status).toBe("paid");
  expect(b.transitioned).toBe(false);
});

test("setInvoice stores invoice id and payment url", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-6", plan, email: "a@b.co" });
  setInvoice(db, "ord-6", "BAYAR-123", "https://pay.test/x");
  const o = getOrderByInvoice(db, "BAYAR-123");
  expect(o).not.toBeNull();
  expect(o!.paymentUrl).toBe("https://pay.test/x");
});

test("setDiscordNotified sets flag", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-7", plan, email: "a@b.co" });
  setDiscordNotified(db, "ord-7");
  expect(getOrderById(db, "ord-7")!.discordNotified).toBe(true);
});

test("findReusablePending returns newest active pending for email+plan", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-old", plan, email: "a@b.co" });
  setInvoice(db, "ord-old", "INV-OLD", "https://pay.test/old");
  createOrder(db, { id: "ord-new", plan, email: "a@b.co" });
  setInvoice(db, "ord-new", "INV-NEW", "https://pay.test/new");
  db.query(`UPDATE orders SET created_at = ? WHERE id = ?`).run(iso(1000), "ord-new");
  const found = findReusablePending(db, "a@b.co", "10m");
  expect(found).not.toBeNull();
  expect(found!.id).toBe("ord-new");
  expect(found!.paymentUrl).toBe("https://pay.test/new");
});

test("findReusablePending misses expired, other plan, paid, or missing url", () => {
  const db = freshDb();
  createOrder(db, { id: "ord-exp", plan, email: "a@b.co" });
  setInvoice(db, "ord-exp", "INV-E", "https://pay.test/e");
  db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(iso(-60_000), "ord-exp");
  expect(findReusablePending(db, "a@b.co", "10m")).toBeNull();

  createOrder(db, { id: "ord-plan", plan, email: "a@b.co" });
  setInvoice(db, "ord-plan", "INV-P", "https://pay.test/p");
  expect(findReusablePending(db, "a@b.co", "1m")).toBeNull();

  createOrder(db, { id: "ord-paid", plan, email: "c@d.co" });
  setInvoice(db, "ord-paid", "INV-PAID", "https://pay.test/paid");
  markPaid(db, "ord-paid", iso(0), 40123);
  expect(findReusablePending(db, "c@d.co", "10m")).toBeNull();

  createOrder(db, { id: "ord-nourl", plan, email: "e@f.co" });
  expect(findReusablePending(db, "e@f.co", "10m")).toBeNull();
});
```

- [ ] **Step 6: Jalankan, pastikan gagal**

Run: `bun test src/lib/orders.test.ts`
Expected: FAIL — modul `./orders` tidak ditemukan.

- [ ] **Step 7: Implementasi `src/lib/orders.ts`**

```ts
import type { Database } from "./db";
import type { Plan } from "./plans";

export type OrderStatus = "pending" | "paid" | "expired";

export type Order = {
  id: string;
  invoiceId: string | null;
  planId: string;
  planName: string;
  tokens: string;
  amountIdr: number;
  finalAmountIdr: number | null;
  email: string;
  discordId: string | null;
  whatsapp: string | null;
  telegram: string | null;
  status: OrderStatus;
  paymentUrl: string | null;
  paidAt: string | null;
  expiresAt: string;
  discordNotified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NewOrderInput = {
  id: string;
  plan: Plan;
  email: string;
  discordId?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
};

const TTL_MS = 30 * 60 * 1000;
/** Surcharge kode unik maksimum di atas nominal order (gaya bayar.gg). */
const AMOUNT_UNIQUE_CODE_MAX = 999;

export function isPaidAmountAcceptable(
  orderAmountIdr: number,
  finalAmountIdr: number | null | undefined
): boolean {
  if (typeof finalAmountIdr !== "number" || !Number.isFinite(finalAmountIdr)) return false;
  if (finalAmountIdr < orderAmountIdr) return false;
  return finalAmountIdr <= orderAmountIdr + AMOUNT_UNIQUE_CODE_MAX;
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    planId: r.plan_id,
    planName: r.plan_name,
    tokens: r.tokens,
    amountIdr: r.amount_idr,
    finalAmountIdr: r.final_amount_idr,
    email: r.email,
    discordId: r.discord_id,
    whatsapp: r.whatsapp,
    telegram: r.telegram,
    status: r.status,
    paymentUrl: r.payment_url,
    paidAt: r.paid_at,
    expiresAt: r.expires_at,
    discordNotified: r.discord_notified === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createOrder(db: Database, input: NewOrderInput): Order {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  db.query(
    `INSERT INTO orders
      (id, invoice_id, plan_id, plan_name, tokens, amount_idr, email, discord_id, whatsapp, telegram, status, expires_at, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(
    input.id,
    input.plan.id,
    input.plan.name,
    input.plan.tokens,
    input.plan.amountIdr,
    input.email,
    input.discordId ?? null,
    input.whatsapp ?? null,
    input.telegram ?? null,
    expiresAt,
    now,
    now
  );
  return getOrderById(db, input.id)!;
}

export function getOrderById(db: Database, id: string): Order | null {
  const r = db.query(`SELECT * FROM orders WHERE id = ?`).get(id);
  return r ? rowToOrder(r) : null;
}

export function getOrderByInvoice(db: Database, invoiceId: string): Order | null {
  const r = db.query(`SELECT * FROM orders WHERE invoice_id = ?`).get(invoiceId);
  return r ? rowToOrder(r) : null;
}

export function findReusablePending(db: Database, email: string, planId: string): Order | null {
  const now = new Date().toISOString();
  const r = db
    .query(
      `SELECT * FROM orders
       WHERE email = ?
         AND plan_id = ?
         AND status = 'pending'
         AND expires_at > ?
         AND invoice_id IS NOT NULL
         AND payment_url IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(email, planId, now);
  return r ? rowToOrder(r) : null;
}

export function expireIfDue(db: Database, order: Order): Order {
  if (order.status !== "pending") return order;
  if (new Date(order.expiresAt).getTime() > Date.now()) return order;
  const now = new Date().toISOString();
  db.query(
    `UPDATE orders SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'pending'`
  ).run(now, order.id);
  return getOrderById(db, order.id)!;
}

export function markPaid(
  db: Database,
  id: string,
  paidAt: string,
  finalAmountIdr: number | null
): { order: Order; transitioned: boolean } {
  const now = new Date().toISOString();
  const result = db
    .query(
      `UPDATE orders SET status = 'paid', paid_at = ?, final_amount_idr = ?, updated_at = ? WHERE id = ? AND status = 'pending'`
    )
    .run(paidAt, finalAmountIdr, now, id);
  const order = getOrderById(db, id)!;
  return { order, transitioned: result.changes > 0 };
}

export function setInvoice(db: Database, id: string, invoiceId: string, paymentUrl: string): void {
  const now = new Date().toISOString();
  db.query(`UPDATE orders SET invoice_id = ?, payment_url = ?, updated_at = ? WHERE id = ?`).run(
    invoiceId,
    paymentUrl,
    now,
    id
  );
}

export function setDiscordNotified(db: Database, id: string): void {
  const now = new Date().toISOString();
  db.query(`UPDATE orders SET discord_notified = 1, updated_at = ? WHERE id = ?`).run(now, id);
}
```

- [ ] **Step 8: Jalankan, pastikan lulus**

Run: `bun test src/lib/orders.test.ts`
Expected: 11 pass, 0 fail.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ && git commit -m "feat: tambah sqlite db dan orders store beserta test"
```

---

### Task 5: External services — bayar, turnstile, discord (TDD)

**Files:**
- Create: `src/lib/bayar.ts`
- Create: `src/lib/bayar.test.ts`
- Create: `src/lib/turnstile.ts`
- Create: `src/lib/turnstile.test.ts`
- Create: `src/lib/discord.ts`
- Create: `src/lib/discord.test.ts`

**Interfaces:**
- Consumes: `env` dari `./env`; `mockFetch`, `withEnv` dari `./test-helpers`; `Order` dari `./orders`
- Produces:
  - `createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>` — field `invoiceId`, `paymentUrl`, `finalAmount?`, `status`, `expiresAt?`
  - `checkPayment(invoiceId: string): Promise<CheckPaymentResult | null>` — field `status`, `finalAmount?`, `paidAt?`
  - `verifyTurnstile(token: string, remoteIp?: string): Promise<{ success: boolean; error?: string }>`
  - `buildPaidEmbed(order: Order): unknown`
  - `sendPaidNotification(order: Order): Promise<{ ok: boolean; error?: string }>`

- [ ] **Step 1: Tulis test gagal `src/lib/bayar.test.ts`**

```ts
import { test, expect } from "bun:test";
import { createPayment, checkPayment } from "./bayar";
import { withEnv, mockFetch } from "./test-helpers";

const CREATE = "https://www.bayar.gg/api/create-payment.php";
const CHECK = "https://www.bayar.gg/api/check-payment.php?invoice=BAYAR-1";

test("createPayment posts and maps response", async () => {
  globalThis.fetch = mockFetch({
    [CREATE]: {
      body: {
        success: true,
        data: {
          invoice_id: "BAYAR-1",
          payment_url: "https://www.bayar.gg/pay?invoice=BAYAR-1",
          final_amount: 40123,
          status: "pending",
          expires_at: "2026-07-23 13:00:00",
        },
      },
    },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await createPayment({
      amount: 40000,
      description: "Tokenizer 10M — a@b.co",
      customerEmail: "a@b.co",
      callbackUrl: "https://x.test/api/webhooks/bayar",
      redirectUrl: "https://x.test/order/success?order=ord-1",
    });
    expect(r.invoiceId).toBe("BAYAR-1");
    expect(r.paymentUrl).toContain("BAYAR-1");
    expect(r.finalAmount).toBe(40123);
    expect(r.status).toBe("pending");
  });
});

test("createPayment throws when success=false", async () => {
  globalThis.fetch = mockFetch({
    [CREATE]: { status: 400, body: { success: false, message: "bad amount" } },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    await expect(
      createPayment({
        amount: 10,
        description: "x",
        callbackUrl: "https://x.test/api/webhooks/bayar",
        redirectUrl: "https://x.test/order/success?order=o",
      })
    ).rejects.toThrow();
  });
});

test("checkPayment returns paid result", async () => {
  globalThis.fetch = mockFetch({
    [CHECK]: {
      body: {
        success: true,
        status: "paid",
        final_amount: 40123,
        paid_at: "2026-07-23 12:30:00",
      },
    },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await checkPayment("BAYAR-1");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("paid");
    expect(r!.finalAmount).toBe(40123);
  });
});

test("checkPayment returns null when not found", async () => {
  globalThis.fetch = mockFetch({
    [CHECK]: { status: 404, body: { success: false } },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await checkPayment("BAYAR-1");
    expect(r).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `bun test src/lib/bayar.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi `src/lib/bayar.ts`**

```ts
import { env } from "./env";

export type CreatePaymentInput = {
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl: string;
  redirectUrl: string;
};

export type CreatePaymentResult = {
  invoiceId: string;
  paymentUrl: string;
  finalAmount?: number;
  status: string;
  expiresAt?: string;
};

export type CheckPaymentResult = {
  status: string;
  finalAmount?: number;
  paidAt?: string;
};

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Key": env.bayarApiKey,
  };
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    description: input.description,
    payment_url: env.bayarPaymentUrl,
    payment_method: env.bayarMethod,
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
  };
  if (input.customerEmail) body.customer_email = input.customerEmail;
  if (input.customerPhone) body.customer_phone = input.customerPhone;

  const res = await fetch(`${env.bayarBaseUrl}/create-payment.php`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.success !== true) {
    throw new Error(`bayar.gg create-payment failed: ${data?.message ?? res.status}`);
  }
  const d = data.data ?? data;
  return {
    invoiceId: d.invoice_id,
    paymentUrl: d.payment_url,
    finalAmount: typeof d.final_amount === "number" ? d.final_amount : undefined,
    status: d.status ?? "pending",
    expiresAt: d.expires_at,
  };
}

export async function checkPayment(invoiceId: string): Promise<CheckPaymentResult | null> {
  const url = `${env.bayarBaseUrl}/check-payment.php?invoice=${encodeURIComponent(invoiceId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  const data: any = await res.json().catch(() => null);
  if (!data) return null;
  return {
    status: data.status,
    finalAmount: typeof data.final_amount === "number" ? data.final_amount : undefined,
    paidAt: data.paid_at,
  };
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `bun test src/lib/bayar.test.ts`
Expected: 4 pass, 0 fail.

- [ ] **Step 5: Tulis test gagal `src/lib/turnstile.test.ts`**

```ts
import { test, expect } from "bun:test";
import { verifyTurnstile } from "./turnstile";
import { withEnv, mockFetch } from "./test-helpers";

const GOOD = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

test("verifyTurnstile returns success when CF says success", async () => {
  globalThis.fetch = mockFetch({
    [GOOD]: { body: { success: true } },
  }) as any;
  await withEnv({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_BYPASS: undefined }, async () => {
    const r = await verifyTurnstile("tok");
    expect(r.success).toBe(true);
  });
});

test("verifyTurnstile fails when CF says failure", async () => {
  globalThis.fetch = mockFetch({
    [GOOD]: { body: { success: false, "error-codes": ["bad"] } },
  }) as any;
  await withEnv({ TURNSTILE_SECRET_KEY: "s" }, async () => {
    const r = await verifyTurnstile("tok");
    expect(r.success).toBe(false);
  });
});

test("verifyTurnstile bypasses when TURNSTILE_BYPASS=1", async () => {
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    return Promise.resolve(new Response("{}"));
  }) as any;
  await withEnv({ TURNSTILE_BYPASS: "1", TURNSTILE_SECRET_KEY: "s" }, async () => {
    const r = await verifyTurnstile("");
    expect(r.success).toBe(true);
    expect(called).toBe(false);
  });
});

test("verifyTurnstile fails when token empty and no bypass", async () => {
  await withEnv({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_BYPASS: undefined }, async () => {
    const r = await verifyTurnstile("");
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 6: Jalankan, pastikan gagal**

Run: `bun test src/lib/turnstile.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 7: Implementasi `src/lib/turnstile.ts`**

```ts
import { env } from "./env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  if (env.turnstileBypass) return { success: true };
  if (!token) return { success: false, error: "captcha-required" };
  if (!env.turnstileSecretKey) return { success: false, error: "captcha-not-configured" };

  const body = new URLSearchParams();
  body.set("secret", env.turnstileSecretKey);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data: any = await res.json();
    if (data?.success === true) return { success: true };
    return { success: false, error: data?.["error-codes"]?.[0] ?? "captcha-failed" };
  } catch (e) {
    return { success: false, error: "captcha-unreachable" };
  }
}
```

- [ ] **Step 8: Jalankan, pastikan lulus**

Run: `bun test src/lib/turnstile.test.ts`
Expected: 4 pass, 0 fail.

- [ ] **Step 9: Tulis test gagal `src/lib/discord.test.ts`**

```ts
import { test, expect } from "bun:test";
import { buildPaidEmbed, sendPaidNotification } from "./discord";
import { withEnv, mockFetch } from "./test-helpers";
import type { Order } from "./orders";

function mkOrder(over: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    invoiceId: "BAYAR-1",
    planId: "10m",
    planName: "10M",
    tokens: "10M token",
    amountIdr: 40000,
    finalAmountIdr: 40123,
    email: "a@b.co",
    discordId: "user#1234",
    whatsapp: "628123456789",
    telegram: null,
    status: "paid",
    paymentUrl: "https://pay.test/x",
    paidAt: "2026-07-23T12:30:00.000Z",
    expiresAt: "2026-07-23T13:00:00.000Z",
    discordNotified: false,
    createdAt: "2026-07-23T12:25:00.000Z",
    updatedAt: "2026-07-23T12:30:00.000Z",
    ...over,
  };
}

test("buildPaidEmbed includes plan, email, amount, invoice, and omits empty optionals", () => {
  const payload = buildPaidEmbed(mkOrder({ telegram: null, whatsapp: null, discordId: null })) as any;
  const embed = payload.embeds[0];
  expect(embed.title).toContain("10M");
  const fields = embed.fields as { name: string; value: string }[];
  const byName = Object.fromEntries(fields.map((f) => [f.name, f.value]));
  expect(byName["Email"]).toBe("a@b.co");
  expect(byName["Invoice"]).toBe("BAYAR-1");
  expect(byName["Harga"]).toContain("40123");
  expect(byName["Plan"]).toContain("10M");
  expect("Discord" in byName).toBe(false);
  expect("WhatsApp" in byName).toBe(false);
});

test("buildPaidEmbed includes discord/whatsapp when present", () => {
  const payload = buildPaidEmbed(mkOrder()) as any;
  const byName = Object.fromEntries(payload.embeds[0].fields.map((f: any) => [f.name, f.value]));
  expect(byName["Discord"]).toBe("user#1234");
  expect(byName["WhatsApp"]).toBe("628123456789");
});

test("sendPaidNotification returns ok on 204", async () => {
  globalThis.fetch = mockFetch({
    "https://discord.test/hook": { status: 204, body: "" },
  }) as any;
  await withEnv({ DISCORD_WEBHOOK_URL: "https://discord.test/hook" }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(true);
  });
});

test("sendPaidNotification returns error on failure", async () => {
  globalThis.fetch = mockFetch({
    "https://discord.test/hook": { status: 500, body: { err: "x" } },
  }) as any;
  await withEnv({ DISCORD_WEBHOOK_URL: "https://discord.test/hook" }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});

test("sendPaidNotification returns error when webhook url missing", async () => {
  await withEnv({ DISCORD_WEBHOOK_URL: undefined }, async () => {
    const r = await sendPaidNotification(mkOrder());
    expect(r.ok).toBe(false);
    expect(r.error).toBe("webhook-not-configured");
  });
});
```

- [ ] **Step 10: Jalankan, pastikan gagal**

Run: `bun test src/lib/discord.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 11: Implementasi `src/lib/discord.ts`**

```ts
import { env } from "./env";
import type { Order } from "./orders";

export function buildPaidEmbed(order: Order): unknown {
  const fields: { name: string; value: string }[] = [
    { name: "Plan", value: `${order.planName} (${order.tokens})` },
    { name: "Email", value: order.email },
    { name: "Harga", value: `Rp${order.finalAmountIdr ?? order.amountIdr}` },
    { name: "Invoice", value: order.invoiceId ?? "-" },
  ];
  if (order.discordId) fields.push({ name: "Discord", value: order.discordId });
  if (order.whatsapp) fields.push({ name: "WhatsApp", value: order.whatsapp });
  if (order.telegram) fields.push({ name: "Telegram", value: order.telegram });
  fields.push({ name: "Order ID", value: order.id });
  if (order.paidAt) fields.push({ name: "Paid at", value: order.paidAt });

  return {
    username: "Tokenizer Orders",
    embeds: [
      {
        title: `Payment received — Tokenizer ${order.planName}`,
        color: 0x3ecf8e,
        fields,
        footer: { text: `Tokenizer • ${order.id}` },
        timestamp: order.paidAt ?? new Date().toISOString(),
      },
    ],
  };
}

export async function sendPaidNotification(
  order: Order
): Promise<{ ok: boolean; error?: string }> {
  if (!env.discordWebhookUrl) return { ok: false, error: "webhook-not-configured" };
  try {
    const res = await fetch(env.discordWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPaidEmbed(order)),
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, error: `discord-${res.status}:${text.slice(0, 120)}` };
  } catch (e: any) {
    return { ok: false, error: `discord-unreachable:${e?.message ?? e}` };
  }
}
```

- [ ] **Step 12: Jalankan, pastikan lulus**

Run: `bun test src/lib/discord.test.ts`
Expected: 5 pass, 0 fail.

- [ ] **Step 13: Jalankan seluruh test lib + commit**

Run: `bun test`
Expected: semua pass (plans 8, validate 7, rate-limit 3, env 4, db 2, orders 11, bayar 4, turnstile 4, discord 5 — total 48).

```bash
git add src/lib/ && git commit -m "feat: tambah integrasi bayar.gg, turnstile, discord beserta test"
```

---

### Task 6: Konten Bahasa Indonesia (content/home.ts)

**Files:**
- Create: `src/content/home.ts`
- Create: `src/content/home.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `content` (typed const) + `type Content` — dikonsumsi semua komponen & pages. Struktur field: `brand`, `tagline`, `nav`, `announcement`, `hero`, `logoStrip`, `features`, `comparison`, `stats`, `models`, `pricing`, `testimonials`, `faq`, `finalCta`, `footer`.

- [ ] **Step 1: Tulis test gagal `src/content/home.test.ts`**

```ts
import { test, expect } from "bun:test";
import { content } from "./home";

test("brand dan tagline terisi", () => {
  expect(content.brand).toBe("TOKENIZER");
  expect(content.tagline.length).toBeGreaterThan(0);
});

test("features punya 7 item bernomor 01-07 dengan body", () => {
  expect(content.features.items).toHaveLength(7);
  content.features.items.forEach((f, i) => {
    expect(f.n).toBe(String(i + 1).padStart(2, "0"));
    expect(f.title.length).toBeGreaterThan(0);
    expect(f.body.length).toBeGreaterThan(0);
  });
});

test("models punya 13 item dengan tier valid", () => {
  expect(content.models.items).toHaveLength(13);
  for (const m of content.models.items) {
    expect(m.name.length).toBeGreaterThan(0);
    expect(m.provider.length).toBeGreaterThan(0);
    expect(["Pro", "Free"]).toContain(m.tier);
  }
});

test("faq punya 6 tanya-jawab non-kosong", () => {
  expect(content.faq.items).toHaveLength(6);
  for (const f of content.faq.items) {
    expect(f.q.length).toBeGreaterThan(0);
    expect(f.a.length).toBeGreaterThan(0);
  }
});

test("badges pricing merujuk plan id yang valid", () => {
  expect(content.pricing.badges.popular.planId).toBe("10m");
  expect(content.pricing.badges.bestValue.planId).toBe("100m");
});

test("tidak ada emoji pada copy UI (anti-slop)", () => {
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
  expect(emojiRe.test(JSON.stringify(content))).toBe(false);
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `bun test src/content/home.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi `src/content/home.ts`**

```ts
export const content = {
  brand: "TOKENIZER",
  tagline: "Token AI frontier. Satu API. Murah.",

  nav: {
    links: [
      { label: "Fitur", href: "/#fitur" },
      { label: "Model", href: "/#model" },
      { label: "Harga", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
    cta: { label: "Dapatkan API key", href: "/pricing" },
  },

  announcement: {
    text: "Deal model frontier — DeepSeek 4×, MiniMax 2.7×, MiMo hemat 99%",
    href: "/pricing",
  },

  hero: {
    label: "gateway token frontier",
    h1Line1: "Token AI frontier.",
    h1Line2: "Satu API. Murah.",
    sub: "Gateway drop-in yang kompatibel dengan OpenAI. DeepSeek, MiniMax, MiMo, dan lainnya — ship agen dan aplikasi tanpa membakar runway.",
    primaryCta: { label: "Dapatkan API key", href: "/pricing" },
    secondaryCta: { label: "Lihat model", href: "#model" },
    codeFile: "ai-tokenizer.py",
  },

  logoStrip: {
    label: "SATU API, 13+ MODEL FRONTIER",
    wordmarks: ["OpenAI", "Anthropic", "DeepSeek", "Zhipu AI", "MiniMax", "Qwen", "Moonshot"],
  },

  features: {
    label: "kenapa tokenizer",
    title: "Gateway token frontier",
    subtitle: "Ship, stream, scale — tetap murah.",
    cta: { label: "Lihat harga paket", href: "/pricing" },
    items: [
      { n: "01", title: "Model frontier", body: "DeepSeek, MiniMax, MiMo, dan lainnya — full-weight, tidak pernah dikuantisasi diam-diam." },
      { n: "02", title: "Multi-provider", body: "Satu API, banyak backend. Ganti model tanpa menulis ulang kode." },
      { n: "03", title: "Kredit yang awet", body: "Promo dan kredit gratis membuat setiap rupiah berlipat ganda." },
      { n: "04", title: "Kompatibel dengan OpenAI", body: "Base URL drop-in. Arahkan SDK Anda ke api.tokenizer.com dan ship." },
      { n: "05", title: "Latensi rendah", body: "Routing yang efisien menjaga first-token latency tetap rendah." },
      { n: "06", title: "Kuota transparan", body: "Limit jelas dan tagihan transparan — tanpa invoice kejutan." },
      { n: "07", title: "Dasbor & API key", body: "Key per proyek, grafik pemakaian, dan tim dalam satu konsol." },
    ],
  },

  comparison: {
    label: "sebelum / sesudah",
    without: {
      title: "Tanpa TOKENIZER",
      points: [
        "Harga list per-token yang mahal",
        "Terkunci di satu ekosistem",
        "Tagihan dan kuota tidak transparan",
        "Invoice kejutan saat scale",
      ],
    },
    with: {
      title: "Dengan TOKENIZER",
      points: [
        "Model frontier dengan harga murah",
        "Satu API, banyak provider",
        "Dasbor pemakaian yang transparan",
        "Kredit yang berlipat hingga 100×",
      ],
    },
  },

  stats: {
    items: [
      { value: "10×", label: "lebih murah", body: "Dibanding harga list big-lab." },
      { value: "2×", label: "setup lebih cepat", body: "Satu base URL, ganti SDK dalam hitungan menit." },
      { value: "5×", label: "lebih jauh per rupiah", body: "Promo kredit memperpanjang setiap sen." },
      { value: "100%", label: "model full-weight", body: "Tidak pernah dikuantisasi diam-diam." },
    ],
  },

  models: {
    label: "model",
    title: "Satu API, 13+ model frontier",
    subtitle: "OpenAI GPT 5.X, Claude, dan model-model top China — dalam satu API.",
    note: "Daftar model dapat berubah mengikuti ketersediaan dari provider.",
    items: [
      { name: "GPT 5.5", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.4", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Sol", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Terra", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Luna", provider: "OpenAI", tier: "Pro" },
      { name: "Claude Opus 4.6", provider: "Anthropic", tier: "Pro" },
      { name: "Claude Opus 4.7", provider: "Anthropic", tier: "Pro" },
      { name: "DeepSeek V4 Pro", provider: "DeepSeek", tier: "Pro" },
      { name: "DeepSeek V4 Flash", provider: "DeepSeek", tier: "Free" },
      { name: "GLM-5.2", provider: "Zhipu AI", tier: "Pro" },
      { name: "MiniMax M3", provider: "MiniMax", tier: "Pro" },
      { name: "Qwen 3.8", provider: "Alibaba Qwen", tier: "Pro" },
      { name: "Kimi K3", provider: "Moonshot", tier: "Pro" },
    ],
  },

  pricing: {
    label: "harga",
    title: "Pilih paket yang cocok",
    subtitle: "Bayar sesuai kuota dan masa aktif token. Top-up kapan saja.",
    note: "Harga token dapat berubah sewaktu-waktu mengikuti harga dari provider.",
    perMillion: "per 1M token",
    durationLabel: "Masa aktif",
    ctaLabel: "Mulai sekarang",
    badges: {
      popular: { planId: "10m", label: "Populer" },
      bestValue: { planId: "100m", label: "Best value" },
    },
  },

  testimonials: {
    label: "komunitas",
    title: "Disukai developer. Founder juga.",
    items: [
      {
        quote: "TOKENIZER memangkas tagihan token kami 80%. Kualitas frontier yang sama, dengan biaya yang jauh lebih kecil. Kami berhenti membandingkan provider.",
        name: "Zeno Rocha",
        role: "Founder · Resend",
        avatar: "https://github.com/zenorocha.png?s=160",
      },
      {
        quote: "Provider pertama yang membuat saya percaya open model di production. Harness-nya sangat solid, sampai saya harus memastikan ulang bahwa saya masih memakai DeepSeek Flash.",
        name: "David Thyresson",
        role: "GP · PWV",
        avatar: "https://github.com/dthyresson.png?s=160",
      },
    ],
  },

  faq: {
    label: "faq",
    title: "Pertanyaan, terjawab.",
    items: [
      { q: "Apa bedanya TOKENIZER dengan OpenAI atau Anthropic langsung?", a: "TOKENIZER adalah gateway terpadu ke model frontier — open maupun closed — dengan tarif yang jauh lebih murah. Satu API, banyak provider, tagihan transparan." },
      { q: "Model apa saja yang tersedia?", a: "DeepSeek, MiniMax, MiMo, Qwen, Kimi, GLM, dan lainnya. Vendor baru ditambahkan secara berkala — lihat daftar lengkap di bagian Model." },
      { q: "Apakah API-nya kompatibel dengan OpenAI?", a: "Ya. Arahkan SDK OpenAI apa pun ke https://api.tokenizer.com/v1 dan langsung berfungsi tanpa mengubah kode." },
      { q: "Apakah data saya dipakai untuk training?", a: "Tidak, tidak pernah. Prompt dan completion Anda tidak digunakan untuk training sama sekali." },
      { q: "Bagaimana sistem kuota dan pembayarannya?", a: "Beli paket kuota sesuai kebutuhan, bayar via QRIS atau e-wallet, dan top-up kapan saja. Kuota makin awet dipakai di model yang lebih murah." },
      { q: "Berapa biaya untuk mulai?", a: "Mulai dari Rp10.000 untuk 1M token dengan masa aktif 7 hari. Tanpa kartu kredit, tanpa langganan." },
    ],
  },

  finalCta: {
    title: "Siap ship dengan token yang lebih murah?",
    sub: "Mulai dari Rp10.000 — tanpa kartu kredit, tanpa langganan.",
    codeChip: "curl https://api.tokenizer.com/v1/models",
    primaryCta: { label: "Dapatkan API key", href: "/pricing" },
    secondaryCta: { label: "Jelajahi model", href: "#model" },
  },

  footer: {
    columns: [
      {
        title: "Produk",
        links: [
          { label: "Fitur", href: "/#fitur" },
          { label: "Model", href: "/#model" },
          { label: "Harga", href: "/pricing" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
    ],
    socials: [
      { label: "X", icon: "x", href: "https://x.com/" },
      { label: "GitHub", icon: "github", href: "https://github.com/" },
      { label: "Discord", icon: "discord", href: "https://discord.com/" },
    ],
    copyright: "© 2026 TOKENIZER. Seluruh hak cipta dilindungi.",
  },
} as const;

export type Content = typeof content;
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `bun test src/content/home.test.ts`
Expected: 6 pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/content/ && git commit -m "feat: tambah model konten Bahasa Indonesia beserta sanity test"
```

---

### Task 7: Fondasi UI — icons, section-label, announcement, navbar, footer, client.js

**Files:**
- Create: `src/components/icons.tsx`
- Create: `src/components/section-label.tsx`
- Create: `src/components/announcement.tsx`
- Create: `src/components/navbar.tsx`
- Create: `src/components/footer.tsx`
- Modify: `src/client/main.ts` (ganti stub)
- Modify: `src/index.tsx` (tambah route `/` shell sementara)

**Interfaces:**
- Consumes: `Layout` dari `../server`; `content` dari `../content/home`
- Produces:
  - `LogoMark`, `IconArrowRight`, `IconCheck`, `IconX`, `IconMenu`, `IconCopy`, `IconChevronDown`, `IconBrandX`, `IconBrandGithub`, `IconBrandDiscord` — semua `FC<{ size?: number; class?: string }>`
  - `SectionLabel: FC<{ children: string }>`
  - `Announcement`, `Navbar`, `Footer` FC (dipakai semua pages)
  - Selector client: `[data-mobile-toggle]`, `[data-mobile-menu]`, `[data-copy]`, `[data-copy-label]`, `[data-reveal]` + class `reveal-in`

- [ ] **Step 1: Buat `src/components/icons.tsx`**

```tsx
import type { FC, Child } from "hono/jsx";

type IconProps = { size?: number; class?: string };

const Stroke: FC<IconProps & { children: Child }> = ({ size = 16, class: cls, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={cls}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Fill: FC<IconProps & { children: Child }> = ({ size = 16, class: cls, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={cls} aria-hidden="true">
    {children}
  </svg>
);

export const IconArrowRight: FC<IconProps> = (p) => (
  <Stroke {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Stroke>
);

export const IconCheck: FC<IconProps> = (p) => (
  <Stroke {...p}><path d="M20 6 9 17l-5-5" /></Stroke>
);

export const IconX: FC<IconProps> = (p) => (
  <Stroke {...p}><path d="M18 6 6 18M6 6l12 12" /></Stroke>
);

export const IconMenu: FC<IconProps> = (p) => (
  <Stroke {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Stroke>
);

export const IconCopy: FC<IconProps> = (p) => (
  <Stroke {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Stroke>
);

export const IconChevronDown: FC<IconProps> = (p) => (
  <Stroke {...p}><path d="m6 9 6 6 6-6" /></Stroke>
);

export const IconBrandX: FC<IconProps> = (p) => (
  <Fill {...p}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </Fill>
);

export const IconBrandGithub: FC<IconProps> = (p) => (
  <Fill {...p}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </Fill>
);

export const IconBrandDiscord: FC<IconProps> = (p) => (
  <Fill {...p}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
  </Fill>
);

export const LogoMark: FC<IconProps> = ({ size = 20, class: cls }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" class={cls} aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#3ecf8e" />
    <path d="M9 11h14v3.4h-5.3V23h-3.4v-8.6H9z" fill="#0c0c0c" />
  </svg>
);
```

- [ ] **Step 2: Buat `src/components/section-label.tsx`**

```tsx
import type { FC } from "hono/jsx";

export const SectionLabel: FC<{ children: string }> = ({ children }) => (
  <p class="font-mono text-sm text-faint">
    <span class="text-brand">//</span> {children}
  </p>
);
```

- [ ] **Step 3: Buat `src/components/announcement.tsx`**

```tsx
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
```

- [ ] **Step 4: Buat `src/components/navbar.tsx`**

```tsx
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
```

- [ ] **Step 5: Buat `src/components/footer.tsx`**

```tsx
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
```

- [ ] **Step 6: Ganti stub `src/client/main.ts` dengan interaksi penuh**

```ts
function initMobileNav() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  if (!toggle || !menu) return;

  const set = (open: boolean) => {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    set(!open);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}

function initCopy() {
  document.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const text = el.getAttribute("data-copy");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = el.getAttribute("data-copy-label") || "Salin";
        el.setAttribute("data-copy-label", "Tersalin");
        setTimeout(() => el.setAttribute("data-copy-label", original), 1500);
      } catch {}
    });
  });
}

function initScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("reveal-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initCopy();
  initScrollReveal();
});
```

- [ ] **Step 7: Ganti `src/index.tsx` — tambah route `/` shell sementara (diisi section di Task 8–9)**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { Layout } from "./server";
import { content } from "./content/home";
import { Announcement } from "./components/announcement";
import { Navbar } from "./components/navbar";
import { Footer } from "./components/footer";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(
    <Layout title={`${content.brand} — ${content.tagline}`} description={content.hero.sub}>
      <Announcement />
      <Navbar />
      <main class="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <p class="font-mono text-sm text-faint">
          <span class="text-brand">//</span> section menyusul
        </p>
      </main>
      <Footer />
    </Layout>
  );
  return c.html(`<!doctype html>${html}`);
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 8: Build + smoke test**

Run: `bun run build && bun src/index.tsx & sleep 1 && curl -s http://localhost:3000/ | grep -c "TOKENIZER" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/client.js; kill %1`
Expected: angka `2` atau lebih (wordmark navbar + footer); `200` untuk client.js.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: tambah fondasi UI (icons, navbar, footer, announcement) dan client.js"
```

---

### Task 8: Home sections A — hero, logo-strip, features, comparison, stats

**Files:**
- Create: `src/components/hero.tsx`
- Create: `src/components/logo-strip.tsx`
- Create: `src/components/features.tsx`
- Create: `src/components/comparison.tsx`
- Create: `src/components/stats.tsx`

**Interfaces:**
- Consumes: `content` dari `../content/home`; `SectionLabel`; `IconArrowRight`, `IconCheck`, `IconX` dari `./icons`
- Produces: `Hero`, `LogoStrip`, `Features`, `Comparison`, `Stats` FC — dirakit di `pages/home.tsx` pada Task 9. Section id: `fitur`.

- [ ] **Step 1: Buat `src/components/hero.tsx`**

```tsx
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
            {line.length === 0 ? " " : line.map((s) => <span class={s.c}>{s.t}</span>)}
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
              <span class="text-faint">{h.h1Line2}</span>
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
```

- [ ] **Step 2: Buat `src/components/logo-strip.tsx`**

```tsx
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
```

- [ ] **Step 3: Buat `src/components/features.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconArrowRight } from "./icons";

export const Features: FC = () => {
  const f = content.features;
  return (
    <section id="fitur" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{f.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{f.title}</h2>
          <p class="mt-2 text-muted">{f.subtitle}</p>
        </div>
        <div
          class="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
          data-reveal
        >
          {f.items.map((item) => (
            <div class="bg-background p-6">
              <p class="font-mono text-xs text-faint">{item.n}</p>
              <h3 class="mt-3 font-medium text-foreground">{item.title}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
          <a
            href={f.cta.href}
            class="group flex items-center justify-between gap-4 bg-panel p-6 transition-colors hover:bg-elevated"
          >
            <span class="text-sm font-medium text-foreground">{f.cta.label}</span>
            <IconArrowRight size={16} class="text-brand transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Buat `src/components/comparison.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconCheck, IconX } from "./icons";

export const Comparison: FC = () => {
  const cmp = content.comparison;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{cmp.label}</SectionLabel>
        </div>
        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-border bg-panel p-6" data-reveal>
            <h3 class="font-medium text-muted">{cmp.without.title}</h3>
            <ul class="mt-4 space-y-3">
              {cmp.without.points.map((p) => (
                <li class="flex items-start gap-2.5 text-sm text-muted">
                  <IconX size={15} class="mt-0.5 shrink-0 text-red-400/70" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div class="rounded-lg border border-brand/25 bg-brand/[0.04] p-6" data-reveal>
            <h3 class="font-medium text-foreground">{cmp.with.title}</h3>
            <ul class="mt-4 space-y-3">
              {cmp.with.points.map((p) => (
                <li class="flex items-start gap-2.5 text-sm text-foreground">
                  <IconCheck size={15} class="mt-0.5 shrink-0 text-brand" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 5: Buat `src/components/stats.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";

export const Stats: FC = () => {
  const s = content.stats;
  return (
    <section class="border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div
          class="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          data-reveal
        >
          {s.items.map((it) => (
            <div class="bg-background p-6">
              <p class="text-3xl font-semibold tracking-tight text-foreground">{it.value}</p>
              <p class="mt-1 text-sm font-medium text-foreground">{it.label}</p>
              <p class="mt-1 text-sm text-muted">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 6: Verifikasi build tidak rusak**

Run: `bun run build`
Expected: sukses tanpa error (komponen belum di-wire ke route — itu Task 9).

- [ ] **Step 7: Commit**

```bash
git add src/components/ && git commit -m "feat: tambah section hero, logo strip, features, comparison, stats"
```

---

### Task 9: Home sections B — models, pricing-cards, testimonials, faq, final-cta + rakit home

**Files:**
- Create: `src/components/models.tsx`
- Create: `src/components/pricing-cards.tsx`
- Create: `src/components/testimonials.tsx`
- Create: `src/components/faq.tsx`
- Create: `src/components/final-cta.tsx`
- Create: `src/pages/home.tsx`
- Modify: `src/index.tsx`

**Interfaces:**
- Consumes: `PLANS`, `formatIdr`, `pricePerMillion` dari `../lib/plans`; `content`; `SectionLabel`; `IconCheck`, `IconChevronDown`, `IconCopy`, `IconArrowRight`; section dari Task 8
- Produces: `HomePage` FC; section id `model`, `harga`, `faq`; route `GET /` menyajikan home lengkap

- [ ] **Step 1: Buat `src/components/models.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";

export const Models: FC = () => {
  const m = content.models;
  return (
    <section id="model" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{m.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{m.title}</h2>
          <p class="mt-2 max-w-xl text-muted">{m.subtitle}</p>
        </div>
        <div class="mt-10 overflow-x-auto rounded-lg border border-border" data-reveal>
          <table class="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr class="border-b border-border bg-panel">
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Model</th>
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Provider</th>
                <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Tier</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {m.items.map((it) => (
                <tr class="transition-colors hover:bg-panel/60">
                  <td class="px-4 py-3 font-medium text-foreground">{it.name}</td>
                  <td class="px-4 py-3 font-mono text-[13px] text-muted">{it.provider}</td>
                  <td class="px-4 py-3">
                    {it.tier === "Free" ? (
                      <span class="inline-block rounded border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand">
                        Free
                      </span>
                    ) : (
                      <span class="inline-block rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted">
                        Pro
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-faint">{m.note}</p>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Buat `src/components/pricing-cards.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconCheck } from "./icons";
import { PLANS, formatIdr, pricePerMillion } from "../lib/plans";

export const PricingCards: FC = () => {
  const p = content.pricing;
  return (
    <section id="harga" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{p.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{p.title}</h2>
          <p class="mt-2 text-muted">{p.subtitle}</p>
        </div>
        <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isPopular = plan.id === p.badges.popular.planId;
            const isBest = plan.id === p.badges.bestValue.planId;
            return (
              <div
                class={`relative rounded-lg border p-5 transition-colors ${
                  isPopular ? "border-brand/50 bg-panel" : "border-border bg-panel hover:border-border-strong"
                }`}
                data-reveal
              >
                {isPopular ? (
                  <span class="absolute -top-2.5 left-4 rounded bg-brand px-2 py-0.5 text-xs font-medium text-black">
                    {p.badges.popular.label}
                  </span>
                ) : null}
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-foreground">{plan.name}</h3>
                  {isBest ? (
                    <span class="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted">
                      {p.badges.bestValue.label}
                    </span>
                  ) : null}
                </div>
                <p class="mt-0.5 text-sm text-muted">{plan.tokens}</p>
                <p class="mt-4 text-2xl font-semibold tracking-tight text-foreground">{plan.priceLabel}</p>
                <ul class="mt-4 space-y-2 text-sm text-muted">
                  <li class="flex items-center gap-2">
                    <IconCheck size={14} class="text-brand" />
                    {p.durationLabel} {plan.duration}
                  </li>
                  <li class="flex items-center gap-2">
                    <IconCheck size={14} class="text-brand" />
                    {formatIdr(pricePerMillion(plan))} {p.perMillion}
                  </li>
                </ul>
                <a
                  href={`/checkout?plan=${plan.id}`}
                  class={`mt-5 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    isPopular
                      ? "bg-brand text-black hover:bg-brand-strong"
                      : "border border-border bg-background text-foreground hover:bg-elevated"
                  }`}
                >
                  {p.ctaLabel}
                </a>
              </div>
            );
          })}
        </div>
        <p class="mt-4 text-xs text-faint">{p.note}</p>
      </div>
    </section>
  );
};
```

- [ ] **Step 3: Buat `src/components/testimonials.tsx`**

```tsx
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
```

- [ ] **Step 4: Buat `src/components/faq.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { SectionLabel } from "./section-label";
import { IconChevronDown } from "./icons";

export const Faq: FC = () => {
  const f = content.faq;
  return (
    <section id="faq" class="scroll-mt-20 border-b border-border">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div data-reveal>
          <SectionLabel>{f.label}</SectionLabel>
          <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{f.title}</h2>
        </div>
        <div class="mt-8 rounded-lg border border-border" data-reveal>
          {f.items.map((it, i) => (
            <details class={`group ${i > 0 ? "border-t border-border" : ""}`}>
              <summary class="faq-summary flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:text-brand">
                {it.q}
                <IconChevronDown size={16} class="shrink-0 text-faint transition-transform group-open:rotate-180" />
              </summary>
              <p class="px-5 pb-5 text-sm leading-relaxed text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 5: Buat `src/components/final-cta.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { content } from "../content/home";
import { IconArrowRight, IconCopy } from "./icons";

export const FinalCta: FC = () => {
  const c = content.finalCta;
  return (
    <section class="relative overflow-hidden">
      <div
        class="absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(ellipse_50%_100%_at_50%_100%,rgba(62,207,142,0.06),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <div data-reveal>
          <h2 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{c.title}</h2>
          <p class="mt-3 text-muted">{c.sub}</p>
          <div class="mt-8 inline-flex items-center gap-3 rounded-md border border-border bg-panel px-4 py-2.5">
            <code class="font-mono text-sm text-muted">
              <span class="text-brand">$</span> {c.codeChip}
            </code>
            <button
              type="button"
              class="text-faint transition-colors hover:text-foreground"
              aria-label="Salin perintah"
              data-copy={c.codeChip}
              data-copy-label="Salin"
            >
              <IconCopy size={14} />
            </button>
          </div>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={c.primaryCta.href}
              class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
            >
              {c.primaryCta.label}
              <IconArrowRight size={15} />
            </a>
            <a
              href={c.secondaryCta.href}
              class="inline-flex h-11 items-center justify-center rounded-md border border-border bg-panel px-6 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              {c.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 6: Buat `src/pages/home.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Announcement } from "../components/announcement";
import { Navbar } from "../components/navbar";
import { Hero } from "../components/hero";
import { LogoStrip } from "../components/logo-strip";
import { Features } from "../components/features";
import { Comparison } from "../components/comparison";
import { Stats } from "../components/stats";
import { Models } from "../components/models";
import { PricingCards } from "../components/pricing-cards";
import { Testimonials } from "../components/testimonials";
import { Faq } from "../components/faq";
import { FinalCta } from "../components/final-cta";
import { Footer } from "../components/footer";

export const HomePage: FC = () => (
  <Layout title={`${content.brand} — ${content.tagline}`} description={content.hero.sub}>
    <Announcement />
    <Navbar />
    <main>
      <Hero />
      <LogoStrip />
      <Features />
      <Comparison />
      <Stats />
      <Models />
      <PricingCards />
      <Testimonials />
      <Faq />
      <FinalCta />
    </main>
    <Footer />
  </Layout>
);
```

- [ ] **Step 7: Ganti `src/index.tsx` — route `/` memakai HomePage**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 8: Build + smoke test home lengkap**

Run: `bun run build && bun src/index.tsx & sleep 1 && curl -s http://localhost:3000/ | grep -oE "Satu API, 13\+ model frontier|Pilih paket yang cocok|Pertanyaan, terjawab|Rp40.000|/checkout\?plan=10m" | sort -u; kill %1`
Expected: 5 baris unik ditemukan (kelima string tampil).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: rakit halaman home lengkap (models, pricing, testimoni, faq, final cta)"
```

---

### Task 10: Halaman pricing

**Files:**
- Create: `src/pages/pricing.tsx`
- Modify: `src/index.tsx`

**Interfaces:**
- Consumes: `PricingCards`, `Navbar`, `Footer`, `SectionLabel`, `IconChevronDown`; `PLANS`, `formatIdr`, `pricePerMillion`; `content`
- Produces: `PricingPage` FC; route `GET /pricing`

- [ ] **Step 1: Buat `src/pages/pricing.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { PricingCards } from "../components/pricing-cards";
import { SectionLabel } from "../components/section-label";
import { IconChevronDown } from "../components/icons";
import { PLANS, formatIdr, pricePerMillion } from "../lib/plans";

const PRICING_FAQ: { q: string; a: string }[] = [
  {
    q: "Kenapa harga bisa berubah?",
    a: "Harga token mengikuti harga dari provider. Jika provider menaikkan atau menurunkan harga, paket menyesuaikan — kuota yang sudah Anda beli tetap berlaku.",
  },
  {
    q: "Bagaimana cara membayar?",
    a: "Pembayaran via QRIS atau e-wallet melalui bayar.gg. API key dikirim ke email Anda setelah pembayaran terkonfirmasi.",
  },
  {
    q: "Apakah bisa top-up?",
    a: "Bisa. Beli paket baru kapan saja — kuota langsung ditambahkan ke akun Anda.",
  },
];

export const PricingPage: FC = () => {
  const p = content.pricing;
  return (
    <Layout title={`Harga — ${content.brand}`} description={p.subtitle}>
      <Navbar />
      <main>
        <section class="border-b border-border">
          <div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <SectionLabel>{p.label}</SectionLabel>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{p.title}</h1>
            <p class="mt-2 max-w-xl text-muted">{p.subtitle}</p>
          </div>
        </section>

        <PricingCards />

        <section class="border-b border-border">
          <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div data-reveal>
              <SectionLabel>perbandingan paket</SectionLabel>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Bandingkan paket
              </h2>
            </div>
            <div class="mt-10 overflow-x-auto rounded-lg border border-border" data-reveal>
              <table class="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr class="border-b border-border bg-panel">
                    <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Paket</th>
                    <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Kuota</th>
                    <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Harga</th>
                    <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">per 1M token</th>
                    <th class="px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-faint">Masa aktif</th>
                    <th class="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  {PLANS.map((plan) => (
                    <tr class="transition-colors hover:bg-panel/60">
                      <td class="px-4 py-3 font-medium text-foreground">
                        {plan.name}
                        {plan.id === p.badges.popular.planId ? (
                          <span class="ml-2 rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-black">
                            {p.badges.popular.label}
                          </span>
                        ) : null}
                      </td>
                      <td class="px-4 py-3 text-muted">{plan.tokens}</td>
                      <td class="px-4 py-3 text-foreground">{plan.priceLabel}</td>
                      <td class="px-4 py-3 font-mono text-[13px] text-muted">
                        {formatIdr(pricePerMillion(plan))}
                      </td>
                      <td class="px-4 py-3 text-muted">{plan.duration}</td>
                      <td class="px-4 py-3 text-right">
                        <a
                          href={`/checkout?plan=${plan.id}`}
                          class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-elevated"
                        >
                          Pilih
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="mt-3 text-xs text-faint">{p.note}</p>
          </div>
        </section>

        <section>
          <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <div data-reveal>
              <SectionLabel>faq harga</SectionLabel>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Pertanyaan seputar harga
              </h2>
            </div>
            <div class="mt-8 rounded-lg border border-border" data-reveal>
              {PRICING_FAQ.map((it, i) => (
                <details class={`group ${i > 0 ? "border-t border-border" : ""}`}>
                  <summary class="faq-summary flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:text-brand">
                    {it.q}
                    <IconChevronDown size={16} class="shrink-0 text-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <p class="px-5 pb-5 text-sm leading-relaxed text-muted">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Layout>
  );
};
```

- [ ] **Step 2: Ganti `src/index.tsx` — tambah route `/pricing`**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/pricing", (c) => {
  const html = renderToString(<PricingPage />);
  return c.html(`<!doctype html>${html}`);
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 3: Build + smoke test**

Run: `bun run build && bun src/index.tsx & sleep 1 && curl -s http://localhost:3000/pricing | grep -oE "Bandingkan paket|Pertanyaan seputar harga|Rp300.000" | sort -u; kill %1`
Expected: 3 baris unik ditemukan.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: tambah halaman pricing dengan tabel perbandingan paket"
```

---

### Task 11: Halaman checkout + route GET/POST

**Files:**
- Create: `src/pages/checkout.tsx`
- Modify: `src/index.tsx`

**Interfaces:**
- Consumes: `getPlan` dari `./lib/plans`; `getDb`; `createOrder`, `findReusablePending`, `setInvoice` dari `./lib/orders`; `verifyTurnstile`; `createPayment` dari `./lib/bayar`; `env`, `isCheckoutConfigured`; `isValidEmail`, `normalizeEmail`, `normalizePhone`; `rateLimitOk`; `Navbar`, `Footer`, `IconCheck`
- Produces:
  - `CheckoutPage` FC dengan props `{ plan: Plan; values?: Partial<FormValues>; errors?: CheckoutError[]; captchaSiteKey: string }`
  - `type FormValues = { email: string; discordId: string; whatsapp: string; telegram: string }`
  - `type CheckoutError = { field?: string; message: string }`
  - Route `GET /checkout?plan=` dan `POST /checkout`

- [ ] **Step 1: Buat `src/pages/checkout.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { IconCheck } from "../components/icons";
import type { Plan } from "../lib/plans";

export type FormValues = {
  email: string;
  discordId: string;
  whatsapp: string;
  telegram: string;
};

export type CheckoutError = { field?: string; message: string };

const Input: FC<{
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  placeholder?: string;
  error?: string;
}> = ({ name, label, type = "text", required, value = "", placeholder, error }) => (
  <div>
    <label class="block text-sm font-medium text-foreground" for={name}>
      {label}
      {required ? <span class="text-brand"> *</span> : null}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      class={`mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-brand ${
        error ? "border-red-500" : "border-border"
      }`}
    />
    {error ? <p class="mt-1 text-xs text-red-400">{error}</p> : null}
  </div>
);

export const CheckoutPage: FC<{
  plan: Plan;
  values?: Partial<FormValues>;
  errors?: CheckoutError[];
  captchaSiteKey: string;
}> = ({ plan, values = {}, errors = [], captchaSiteKey }) => {
  const errFor = (field: string) => errors.find((e) => e.field === field)?.message;
  const general = errors.filter((e) => !e.field);

  return (
    <Layout
      title={`Checkout ${plan.name} — ${content.brand}`}
      description={`Pembelian paket ${plan.name} token.`}
      headExtra={<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>}
    >
      <Navbar />
      <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Checkout</h1>
            <p class="mt-2 text-sm text-muted">Isi data di bawah untuk membuat invoice pembayaran.</p>
            <p class="mt-1 text-xs text-faint">
              API key dikirim ke email (utama). Discord / WhatsApp / Telegram opsional untuk notifikasi.
            </p>

            {general.length > 0 ? (
              <ul class="mt-4 space-y-1 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {general.map((e) => (
                  <li>{e.message}</li>
                ))}
              </ul>
            ) : null}

            <form method="post" action="/checkout" class="mt-6 space-y-4">
              <input type="hidden" name="plan" value={plan.id} />
              <Input
                name="email"
                label="Email"
                type="email"
                required
                value={values.email ?? ""}
                placeholder="anda@email.com"
                error={errFor("email")}
              />
              <Input
                name="discordId"
                label="Discord ID"
                value={values.discordId ?? ""}
                placeholder="username (opsional)"
                error={errFor("discordId")}
              />
              <Input
                name="whatsapp"
                label="WhatsApp"
                value={values.whatsapp ?? ""}
                placeholder="08xxxx (opsional)"
                error={errFor("whatsapp")}
              />
              <Input
                name="telegram"
                label="Telegram"
                value={values.telegram ?? ""}
                placeholder="@username (opsional)"
                error={errFor("telegram")}
              />

              <div>
                <div class="cf-turnstile" data-sitekey={captchaSiteKey} data-theme="dark"></div>
                {errFor("captcha") ? <p class="mt-1 text-xs text-red-400">{errFor("captcha")}</p> : null}
              </div>

              <button
                type="submit"
                class="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
              >
                Bayar sekarang
              </button>
            </form>
          </section>

          <aside class="h-fit rounded-lg border border-border bg-panel p-6">
            <p class="font-mono text-xs uppercase tracking-wider text-faint">Ringkasan paket</p>
            <h2 class="mt-2 text-2xl font-semibold text-foreground">{plan.name}</h2>
            <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">{plan.priceLabel}</p>
            <ul class="mt-6 space-y-2.5 text-sm text-muted">
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Kuota {plan.tokens}
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Masa aktif {plan.duration}
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> Akses multi-model frontier
              </li>
              <li class="flex items-center gap-2">
                <IconCheck size={14} class="text-brand" /> API kompatibel OpenAI
              </li>
            </ul>
            <p class="mt-6 text-xs text-faint">{content.pricing.note}</p>
          </aside>
        </div>
      </main>
      <Footer />
    </Layout>
  );
};
```

- [ ] **Step 2: Ganti `src/index.tsx` — tambah route checkout**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";
import { CheckoutPage } from "./pages/checkout";
import type { CheckoutError } from "./pages/checkout";
import { getPlan } from "./lib/plans";
import { getDb } from "./lib/db";
import { createOrder, setInvoice, findReusablePending } from "./lib/orders";
import { verifyTurnstile } from "./lib/turnstile";
import { createPayment } from "./lib/bayar";
import { env, isCheckoutConfigured } from "./lib/env";
import { isValidEmail, normalizeEmail, normalizePhone } from "./lib/validate";
import { rateLimitOk } from "./lib/rate-limit";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/pricing", (c) => {
  const html = renderToString(<PricingPage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/checkout", (c) => {
  const planId = c.req.query("plan") ?? "";
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");
  const cfg = isCheckoutConfigured();
  const errors: CheckoutError[] = cfg.ok
    ? []
    : [{ message: "Checkout sedang tidak tersedia. Coba lagi nanti." }];
  const html = renderToString(
    <CheckoutPage plan={plan} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
  );
  return c.html(`<!doctype html>${html}`);
});

app.post("/checkout", async (c) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "";
  if (!rateLimitOk(ip)) {
    return c.text("Terlalu banyak permintaan. Coba lagi sebentar.", 429);
  }

  const body = await c.req.parseBody();
  const planId = String(body.plan ?? "");
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");

  const email = normalizeEmail(String(body.email ?? ""));
  const discordId = String(body.discordId ?? "").trim();
  const whatsappRaw = String(body.whatsapp ?? "").trim();
  const telegram = String(body.telegram ?? "").trim();
  const captchaToken = String(body["cf-turnstile-response"] ?? "");

  const values = { email, discordId, whatsapp: whatsappRaw, telegram };
  const errors: CheckoutError[] = [];

  if (!isValidEmail(email)) errors.push({ field: "email", message: "Email tidak valid." });
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : "";
  if (whatsappRaw && !whatsapp)
    errors.push({ field: "whatsapp", message: "Nomor WhatsApp tidak valid." });

  if (errors.length === 0) {
    const captcha = await verifyTurnstile(captchaToken, c.req.header("CF-Connecting-IP"));
    if (!captcha.success) errors.push({ field: "captcha", message: "Verifikasi captcha gagal." });
  }

  const cfg = isCheckoutConfigured();
  if (!cfg.ok) errors.push({ message: "Checkout belum dikonfigurasi." });

  if (errors.length > 0) {
    const html = renderToString(
      <CheckoutPage plan={plan} values={values} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
    );
    return c.html(`<!doctype html>${html}`, 400);
  }

  const db = getDb();
  const reusable = findReusablePending(db, email, plan.id);
  if (reusable?.paymentUrl) {
    return c.redirect(reusable.paymentUrl);
  }

  const id = crypto.randomUUID();
  createOrder(db, {
    id,
    plan,
    email,
    discordId: discordId || null,
    whatsapp: whatsapp || null,
    telegram: telegram || null,
  });

  try {
    const result = await createPayment({
      amount: plan.amountIdr,
      description: `Tokenizer ${plan.name} — ${email}`,
      customerEmail: email,
      customerPhone: whatsapp || undefined,
      callbackUrl: `${env.baseUrl}/api/webhooks/bayar`,
      redirectUrl: `${env.baseUrl}/order/success?order=${id}`,
    });
    setInvoice(db, id, result.invoiceId, result.paymentUrl);
    return c.redirect(result.paymentUrl);
  } catch (e) {
    console.error("createPayment failed", e);
    const html = renderToString(
      <CheckoutPage
        plan={plan}
        values={values}
        errors={[{ message: "Gagal membuat invoice pembayaran. Silakan coba lagi." }]}
        captchaSiteKey={env.turnstileSiteKey}
      />
    );
    return c.html(`<!doctype html>${html}`, 502);
  }
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 3: Build + smoke test checkout**

Run: `bun run build && bun src/index.tsx & sleep 1 && curl -s "http://localhost:3000/checkout?plan=10m" | grep -oE "Ringkasan paket|Bayar sekarang|Checkout sedang tidak tersedia" | sort -u && curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/checkout?plan=bogus" && curl -s -X POST "http://localhost:3000/checkout" -d "plan=10m&email=bukan-email" | grep -c "Email tidak valid"; kill %1`
Expected: 3 string ditemukan di GET (tanpa env, error graceful tampil); `302` untuk plan bogus; `1` untuk error email inline pada POST.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: tambah halaman dan flow checkout (validasi, captcha, bayar.gg)"
```

---

### Task 12: Order success + webhook bayar.gg + route tests

**Files:**
- Create: `src/pages/order-success.tsx`
- Modify: `src/index.tsx`
- Create: `src/index.test.ts`

**Interfaces:**
- Consumes: `getOrderById`, `getOrderByInvoice`, `expireIfDue`, `markPaid`, `setDiscordNotified`, `isPaidAmountAcceptable` dari `./lib/orders`; `checkPayment` dari `./lib/bayar`; `sendPaidNotification` dari `./lib/discord`; `formatIdr` dari `./lib/plans`; `Navbar`, `Footer`, `IconCheck`, `IconX`
- Produces: `OrderSuccessPage` FC dengan props `{ order: Order }`; route `GET /order/success?order=`; route `POST /api/webhooks/bayar`

- [ ] **Step 1: Buat `src/pages/order-success.tsx`**

```tsx
import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { IconCheck, IconX } from "../components/icons";
import { formatIdr } from "../lib/plans";
import type { Order } from "../lib/orders";

export const OrderSuccessPage: FC<{ order: Order }> = ({ order }) => {
  const paid = order.status === "paid";
  const expired = order.status === "expired";
  return (
    <Layout title={`Pesanan ${order.planName} — ${content.brand}`} description="Status pesanan token Anda.">
      <Navbar />
      <main class="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        {paid ? (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand">
              <IconCheck size={24} />
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Pembayaran diterima</h1>
            <p class="mt-3 text-muted">
              Terima kasih! Pesanan <strong class="text-foreground">{order.planName}</strong> ({order.tokens}) sedang
              diproses. API key akan dikirim ke <strong class="text-foreground">{order.email}</strong>.
            </p>
          </div>
        ) : expired ? (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
              <IconX size={24} />
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Pesanan kedaluwarsa</h1>
            <p class="mt-3 text-muted">
              Pembayaran tidak selesai dalam 30 menit. Silakan buat pesanan baru.
            </p>
            <a
              href="/pricing"
              class="mt-6 inline-flex h-10 items-center rounded-md bg-brand px-5 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
            >
              Buat pesanan baru
            </a>
          </div>
        ) : (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 font-mono text-xl text-amber-400">
              …
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Menunggu pembayaran</h1>
            <p class="mt-3 text-muted">
              Jika Anda sudah membayar, tunggu beberapa saat. Pesanan ini kedaluwarsa otomatis jika tidak dibayar
              dalam 30 menit.
            </p>
          </div>
        )}

        <dl class="mt-8 inline-block text-left text-sm">
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Order ID</dt>
            <dd class="font-mono text-foreground">{order.id}</dd>
          </div>
          {order.invoiceId ? (
            <div class="flex justify-between gap-8 py-1">
              <dt class="text-faint">Invoice</dt>
              <dd class="font-mono text-foreground">{order.invoiceId}</dd>
            </div>
          ) : null}
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Paket</dt>
            <dd class="text-foreground">
              {order.planName} — {order.tokens}
            </dd>
          </div>
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Harga</dt>
            <dd class="text-foreground">{formatIdr(order.amountIdr)}</dd>
          </div>
        </dl>

        <p class="mt-8">
          <a href="/" class="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground">
            Kembali ke beranda
          </a>
        </p>
      </main>
      <Footer />
    </Layout>
  );
};
```

- [ ] **Step 2: Ganti `src/index.tsx` — versi final lengkap dengan webhook**

```tsx
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";
import { CheckoutPage } from "./pages/checkout";
import type { CheckoutError } from "./pages/checkout";
import { OrderSuccessPage } from "./pages/order-success";
import { getPlan } from "./lib/plans";
import { getDb } from "./lib/db";
import {
  createOrder,
  getOrderById,
  getOrderByInvoice,
  setInvoice,
  expireIfDue,
  markPaid,
  setDiscordNotified,
  isPaidAmountAcceptable,
  findReusablePending,
} from "./lib/orders";
import { verifyTurnstile } from "./lib/turnstile";
import { createPayment, checkPayment } from "./lib/bayar";
import { sendPaidNotification } from "./lib/discord";
import { env, isCheckoutConfigured } from "./lib/env";
import { isValidEmail, normalizeEmail, normalizePhone } from "./lib/validate";
import { rateLimitOk } from "./lib/rate-limit";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/pricing", (c) => {
  const html = renderToString(<PricingPage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/checkout", (c) => {
  const planId = c.req.query("plan") ?? "";
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");
  const cfg = isCheckoutConfigured();
  const errors: CheckoutError[] = cfg.ok
    ? []
    : [{ message: "Checkout sedang tidak tersedia. Coba lagi nanti." }];
  const html = renderToString(
    <CheckoutPage plan={plan} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
  );
  return c.html(`<!doctype html>${html}`);
});

app.post("/checkout", async (c) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "";
  if (!rateLimitOk(ip)) {
    return c.text("Terlalu banyak permintaan. Coba lagi sebentar.", 429);
  }

  const body = await c.req.parseBody();
  const planId = String(body.plan ?? "");
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");

  const email = normalizeEmail(String(body.email ?? ""));
  const discordId = String(body.discordId ?? "").trim();
  const whatsappRaw = String(body.whatsapp ?? "").trim();
  const telegram = String(body.telegram ?? "").trim();
  const captchaToken = String(body["cf-turnstile-response"] ?? "");

  const values = { email, discordId, whatsapp: whatsappRaw, telegram };
  const errors: CheckoutError[] = [];

  if (!isValidEmail(email)) errors.push({ field: "email", message: "Email tidak valid." });
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : "";
  if (whatsappRaw && !whatsapp)
    errors.push({ field: "whatsapp", message: "Nomor WhatsApp tidak valid." });

  if (errors.length === 0) {
    const captcha = await verifyTurnstile(captchaToken, c.req.header("CF-Connecting-IP"));
    if (!captcha.success) errors.push({ field: "captcha", message: "Verifikasi captcha gagal." });
  }

  const cfg = isCheckoutConfigured();
  if (!cfg.ok) errors.push({ message: "Checkout belum dikonfigurasi." });

  if (errors.length > 0) {
    const html = renderToString(
      <CheckoutPage plan={plan} values={values} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
    );
    return c.html(`<!doctype html>${html}`, 400);
  }

  const db = getDb();
  const reusable = findReusablePending(db, email, plan.id);
  if (reusable?.paymentUrl) {
    return c.redirect(reusable.paymentUrl);
  }

  const id = crypto.randomUUID();
  createOrder(db, {
    id,
    plan,
    email,
    discordId: discordId || null,
    whatsapp: whatsapp || null,
    telegram: telegram || null,
  });

  try {
    const result = await createPayment({
      amount: plan.amountIdr,
      description: `Tokenizer ${plan.name} — ${email}`,
      customerEmail: email,
      customerPhone: whatsapp || undefined,
      callbackUrl: `${env.baseUrl}/api/webhooks/bayar`,
      redirectUrl: `${env.baseUrl}/order/success?order=${id}`,
    });
    setInvoice(db, id, result.invoiceId, result.paymentUrl);
    return c.redirect(result.paymentUrl);
  } catch (e) {
    console.error("createPayment failed", e);
    const html = renderToString(
      <CheckoutPage
        plan={plan}
        values={values}
        errors={[{ message: "Gagal membuat invoice pembayaran. Silakan coba lagi." }]}
        captchaSiteKey={env.turnstileSiteKey}
      />
    );
    return c.html(`<!doctype html>${html}`, 502);
  }
});

app.get("/order/success", (c) => {
  const orderId = c.req.query("order") ?? "";
  if (!orderId) return c.redirect("/");
  const db = getDb();
  let order = getOrderById(db, orderId);
  if (!order) return c.redirect("/");
  order = expireIfDue(db, order);
  const html = renderToString(<OrderSuccessPage order={order} />);
  return c.html(`<!doctype html>${html}`);
});

app.post("/api/webhooks/bayar", async (c) => {
  let payload: any;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ success: true, message: "ignored" }, 200);
  }
  const invoiceId = payload?.invoice_id ? String(payload.invoice_id) : "";
  if (!invoiceId) return c.json({ success: true, message: "ignored" }, 200);

  const db = getDb();
  let order = getOrderByInvoice(db, invoiceId);
  if (!order) {
    console.warn("webhook: invoice not found", invoiceId);
    return c.json({ success: true, message: "ignored" }, 200);
  }

  order = expireIfDue(db, order);
  if (order.status === "expired") {
    console.warn("webhook: late payment for expired order", invoiceId);
    return c.json({ success: true, message: "expired" }, 200);
  }
  if (order.status === "paid" && order.discordNotified) {
    return c.json({ success: true, message: "already-paid" }, 200);
  }

  // Verifikasi ulang ke bayar.gg (body webhook tidak bertanda tangan).
  let verified;
  try {
    verified = await checkPayment(invoiceId);
  } catch (e) {
    console.error("webhook: check-payment error", e);
    return c.json({ success: true, message: "verify-failed" }, 200);
  }
  if (!verified || verified.status !== "paid") {
    return c.json({ success: true, message: "not-paid" }, 202);
  }

  if (!isPaidAmountAcceptable(order.amountIdr, verified.finalAmount)) {
    console.warn("webhook: amount mismatch", {
      invoiceId,
      expected: order.amountIdr,
      finalAmount: verified.finalAmount,
    });
    return c.json({ success: true, message: "amount-mismatch" }, 200);
  }

  const { order: paidOrder, transitioned } = markPaid(
    db,
    order.id,
    verified.paidAt ?? new Date().toISOString(),
    verified.finalAmount ?? null
  );

  if (transitioned || !paidOrder.discordNotified) {
    const discord = await sendPaidNotification(paidOrder);
    if (discord.ok) setDiscordNotified(db, paidOrder.id);
    else console.error("webhook: discord failed", discord.error);
  }

  return c.json({ success: true, message: "paid" }, 200);
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
```

- [ ] **Step 3: Tulis test `src/index.test.ts` (webhook flow + smoke routes)**

```ts
import { test, expect, beforeEach } from "bun:test";
import { app } from "./index";
import { _resetDbForTests, getDb } from "./lib/db";
import { createOrder, setInvoice, getOrderById } from "./lib/orders";
import { PLANS } from "./lib/plans";
import { withEnv } from "./lib/test-helpers";

const DISCORD_URL = "https://discord.test/hook";
const plan = PLANS[2];

let discordCallCount = 0;

function setupFetch(opts: {
  bayarStatus: string;
  bayarFinalAmount?: number;
  bayarPaidAt?: string;
  discordStatus?: number;
}) {
  discordCallCount = 0;
  const discordStatus = opts.discordStatus ?? 204;
  globalThis.fetch = (async (input: any, _init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (url.startsWith("https://www.bayar.gg/api/check-payment.php")) {
      return new Response(
        JSON.stringify({
          success: true,
          status: opts.bayarStatus,
          final_amount: opts.bayarFinalAmount,
          paid_at: opts.bayarPaidAt,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    if (url === DISCORD_URL) {
      discordCallCount++;
      return new Response("", { status: discordStatus });
    }
    return new Response(JSON.stringify({ error: "no mock for " + url }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

function seedOrder(id: string, invoiceId: string, overrides?: { expiresAt?: string }) {
  const db = getDb();
  createOrder(db, { id, plan, email: "a@b.co" });
  setInvoice(db, id, invoiceId, "https://pay.test/x");
  if (overrides?.expiresAt) {
    db.query(`UPDATE orders SET expires_at = ? WHERE id = ?`).run(overrides.expiresAt, id);
  }
  return getOrderById(db, id)!;
}

async function postWebhook(invoiceId: string) {
  return app.fetch(
    new Request("https://x.test/api/webhooks/bayar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })
  );
}

const envVars = {
  BAYAR_GG_API_KEY: "k",
  DISCORD_WEBHOOK_URL: DISCORD_URL,
  BUN_DB_PATH: ":memory:",
};

beforeEach(() => {
  _resetDbForTests(":memory:");
});

test("smoke: GET / returns 200 with brand", async () => {
  const res = await app.fetch(new Request("https://x.test/"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("TOKENIZER");
});

test("smoke: GET /pricing returns 200 with plans", async () => {
  const res = await app.fetch(new Request("https://x.test/pricing"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Pilih paket yang cocok");
  expect(html).toContain("Rp300.000");
});

test("smoke: GET /checkout with unknown plan redirects to /pricing", async () => {
  const res = await app.fetch(new Request("https://x.test/checkout?plan=999m"));
  expect(res.status).toBe(302);
});

test("smoke: GET /checkout with valid plan renders form", async () => {
  const res = await app.fetch(new Request("https://x.test/checkout?plan=10m"));
  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("Checkout");
  expect(html).toContain("Ringkasan paket");
});

test("spoofed webhook (checkPayment says not-paid) -> 202 not-paid", async () => {
  seedOrder("ord-spoof", "INV-SPOOF");
  setupFetch({ bayarStatus: "pending" });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-SPOOF");
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.message).toBe("not-paid");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-spoof");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("verified paid webhook -> 200 paid, order paid + discordNotified", async () => {
  seedOrder("ord-paid", "INV-PAID");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-PAID");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("paid");
    expect(discordCallCount).toBe(1);
    const order = getOrderById(getDb(), "ord-paid");
    expect(order!.status).toBe("paid");
    expect(order!.finalAmountIdr).toBe(40123);
    expect(order!.discordNotified).toBe(true);
  });
});

test("paid with underpaid final_amount -> amount-mismatch, order stays pending", async () => {
  seedOrder("ord-under", "INV-UNDER");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 1000,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-UNDER");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("amount-mismatch");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-under");
    expect(order!.status).toBe("pending");
    expect(order!.discordNotified).toBe(false);
  });
});

test("double webhook -> second returns 200 already-paid", async () => {
  seedOrder("ord-double", "INV-DOUBLE");
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const first = await postWebhook("INV-DOUBLE");
    expect(first.status).toBe(200);
    expect(discordCallCount).toBe(1);

    const second = await postWebhook("INV-DOUBLE");
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.message).toBe("already-paid");
    expect(discordCallCount).toBe(1);

    const order = getOrderById(getDb(), "ord-double");
    expect(order!.status).toBe("paid");
    expect(order!.discordNotified).toBe(true);
  });
});

test("expired order webhook -> 200 expired, no discord fetch", async () => {
  seedOrder("ord-expired", "INV-EXPIRED", {
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  setupFetch({
    bayarStatus: "paid",
    bayarFinalAmount: 40123,
    bayarPaidAt: "2026-07-24 12:30:00",
    discordStatus: 204,
  });
  await withEnv(envVars, async () => {
    const res = await postWebhook("INV-EXPIRED");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("expired");
    expect(discordCallCount).toBe(0);
    const order = getOrderById(getDb(), "ord-expired");
    expect(order!.status).toBe("expired");
    expect(order!.discordNotified).toBe(false);
  });
});
```

- [ ] **Step 4: Jalankan seluruh test**

Run: `bun test`
Expected: semua pass — 48 test lib + 6 test konten + 9 test index = 63 pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: tambah order success page dan webhook bayar.gg beserta route tests"
```

---

### Task 13: Verifikasi akhir + QA visual

**Files:**
- Tidak ada file baru (verifikasi + perbaikan bila perlu)

**Interfaces:**
- Consumes: semua task sebelumnya
- Produces: aplikasi terverifikasi end-to-end

- [ ] **Step 1: Full test suite**

Run: `bun test`
Expected: 63 pass, 0 fail.

- [ ] **Step 2: Full build**

Run: `bun run build`
Expected: sukses; `public/app.css` dan `public/client.js` ter-regenerasi.

- [ ] **Step 3: Runtime smoke semua route**

Run (dengan env kosong/default):
```bash
bun src/index.tsx & sleep 1
curl -s -o /dev/null -w "/ -> %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "/pricing -> %{http_code}\n" http://localhost:3000/pricing
curl -s -o /dev/null -w "/checkout?plan=10m -> %{http_code}\n" "http://localhost:3000/checkout?plan=10m"
curl -s -o /dev/null -w "/order/success (no id) -> %{http_code}\n" "http://localhost:3000/order/success"
curl -s -X POST http://localhost:3000/api/webhooks/bayar -H 'content-type: application/json' -d 'bukan-json' -w "\nwebhook bad json -> %{http_code}\n"
kill %1
```
Expected: `200`, `200`, `200`, `302`, body `{"success":true,"message":"ignored"}` + `200`.

- [ ] **Step 4: QA anti-slop pada HTML & CSS hasil build**

Run:
```bash
bun src/index.tsx & sleep 1
curl -s http://localhost:3000/ | grep -oP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]' | head -5
grep -oP 'linear-gradient\([^)]*\)' public/app.css | sort -u
grep -oP '#[0-9a-fA-F]{6}\b' public/app.css | sort -u
kill %1
```
Expected:
1. Tidak ada output emoji (kosong).
2. `linear-gradient` hanya garis grid `rgba(255,255,255,0.035)` — bukan gradient warna.
3. Daftar hex hanya berisi netral (`#0c0c0c`, `#121212`, `#1b1b1b`, `#242424`, `#363636`, `#ededed`, `#a1a1a1`, `#6e6e6e`), hijau brand (`#3ecf8e`, `#57d9a3`), dan warna status default Tailwind untuk error/pending (red/amber). Tidak ada ungu/biru jenuh.

- [ ] **Step 5: QA manual visual (desktop + mobile)**

Buka `http://localhost:3000/` di browser dan checklist:
- [ ] Hero: grid hairline + glow hijau tipis terlihat; code window rapi; tidak ada elemen lompat saat load
- [ ] Navbar sticky berfungsi; menu mobile buka/tutup (viewport < 768px); tombol Escape menutup menu
- [ ] Semua section ter-reveal halus saat scroll (dan langsung tampil jika `prefers-reduced-motion`)
- [ ] Pricing: kartu 10M punya badge Populer hijau; CTA menuju `/checkout?plan=<id>` yang benar
- [ ] FAQ accordion membuka dengan chevron berputar
- [ ] Checkout: form + ringkasan tampil; error inline merah saat submit email invalid
- [ ] Tidak ada horizontal scroll di mobile (360px)

- [ ] **Step 6: Commit final (jika ada perbaikan dari QA)**

```bash
git add -A && git commit -m "fix: hasil QA visual dan verifikasi akhir" || echo "tidak ada perubahan"
```

---

## Catatan Eksekusi

- Jika test gagal karena state rate-limit antar-test, ingat `hits` adalah Map module-level — test rate-limit memakai IP unik per test (`10.1.x.x`) agar tidak saling mengganggu.
- `bun run dev` memakai `--watch`; hentikan server background (`kill %1`) setelah setiap smoke test agar port 3000 tidak bentrok.
- Env asli (bayar.gg, Turnstile, Discord) TIDAK dibutuhkan untuk menyelesaikan plan ini — semua path error harus tetap graceful.
