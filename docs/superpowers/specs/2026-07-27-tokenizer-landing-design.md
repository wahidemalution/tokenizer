# Desain: TOKENIZER — Landing Page Supabase-Dark (Bun + Hono)

Tanggal: 2026-07-27
Status: Disetujui user
Pendekatan: **A** — project baru di `landing-page-kimi/`, arsitektur & modul backend di-port dari referensi (`/home/wahid/landing-page`), layer visual & copy ditulis ulang dari nol.

## Ringkasan

Landing page marketing + pricing + checkout fungsional penuh untuk TOKENIZER (gateway API token AI frontier, pasar Indonesia). Stack: Bun + Hono (`hono/jsx` SSR), Tailwind CSS v4, SQLite via `bun:sqlite`. Gaya visual: terinspirasi Supabase dark mode — modern, restrained, anti "AI slop". Seluruh copy dalam Bahasa Indonesia.

## Keputusan yang Dikonfirmasi User

| Aspek | Keputusan |
|---|---|
| Konten & bahasa | Full Bahasa Indonesia (brand tetap TOKENIZER, harga Rupiah) |
| Scope | Home + Pricing + Checkout |
| Backend checkout | Fungsional penuh (bayar.gg, SQLite, Turnstile, Discord webhook, rate limit) |
| Styling | Tailwind CSS v4 via `@tailwindcss/cli` |

## 1. Arsitektur & Struktur Project

SSR via `hono/jsx` + `renderToString`. Satu sumber kebenaran konten: `src/content/home.ts` (typed const, Bahasa Indonesia).

```
landing-page-kimi/
├── src/
│   ├── index.tsx          # routes: /, /pricing, /checkout (GET+POST), /order/success, /api/webhooks/bayar
│   ├── server.tsx         # Layout (html shell, fonts, meta)
│   ├── content/home.ts    # semua copy (ID)
│   ├── pages/             # home, pricing, checkout, order-success
│   ├── components/        # navbar, hero, logo-strip, features, comparison, stats,
│   │                      # models, pricing-cards, testimonials, faq, final-cta, footer, icons
│   ├── lib/               # env, plans, validate, db, orders, bayar, turnstile, discord,
│   │                      # rate-limit (+ .test.ts per modul)
│   ├── client/main.ts     # interaksi kecil (scroll reveal, mobile menu)
│   └── styles/app.css     # Tailwind v4 @theme tokens
├── public/                # hasil build css/js, favicon
├── data/                  # sqlite (gitignored)
├── docs/superpowers/specs/
├── .env.example
└── package.json           # scripts: dev, build:css, build:client, build, start, test
```

Port default `3000` (override via env `PORT`). Dependensi runtime hanya `hono`; dev: `tailwindcss`, `@tailwindcss/cli`, `typescript`, `@types/bun`.

## 2. Design System — Supabase Dark, Anti-Slop

Token (Tailwind `@theme`):

- **Warna**: base `#0C0C0C`, panel `#121212`, elevated `#1B1B1B`, border hairline `#242424`; teks `#EDEDED`, muted `#A1A1A1`; aksen hijau Supabase `#3ECF8E` (hover `#57D9A3`). Aksen dipakai hemat: tombol primary, dot status, state aktif, tint syntax code.
- **Tipografi**: Inter (sans) + JetBrains Mono (micro-label & code). Hero ±3.5rem tracking ketat; body 15–16px.
- **Radius** kecil 6–8px; bayangan minim.
- **Elemen khas**: background grid garis hairline + radial glow hijau sangat tipis (di-mask) di hero; chip badge dengan dot hijau; code window dengan tab; tabel/divider hairline; micro-label mono seperti `// gateway token frontier`.
- **Aturan anti-slop eksplisit**: tanpa gradient ungu/biru, tanpa teks gradient, tanpa glassmorphism, tanpa blob/orb, tanpa emoji sebagai bullet, tanpa ilustrasi 3D stok, tanpa bento grid acak.
- **Motion**: fade/translate halus saat scroll; hormati `prefers-reduced-motion`.

## 3. Halaman Home — Section & Copy

1. **Announcement bar** — chip dot hijau: promo model frontier → `/pricing`
2. **Navbar** — logo SVG + wordmark; link: Dokumentasi, Fitur, Model, Harga, Kontak; CTA "Dapatkan API key"; mobile menu
3. **Hero** — micro-label `// gateway token frontier`; H1 "Token AI frontier. / Satu API. Murah."; subcopy ID; CTA primary + secondary; kanan: code window Python (OpenAI-compatible, `base_url="https://api.tokenizer.com/v1"`)
4. **Logo strip** — logo provider (OpenAI, Anthropic, DeepSeek, Zhipu, MiniMax, Qwen, Moonshot) sebagai SVG mono grayscale
5. **Fitur** — 7 item dari referensi (diterjemahkan), grid divider hairline + nomor mono 01–07 (bukan kartu ikon generik)
6. **Perbandingan** — "Tanpa TOKENIZER" vs "Dengan TOKENIZER", dua kolom hairline, check hijau vs silang
7. **Statistik** — 10× lebih murah · 2× setup lebih cepat · 5× lebih hemat per rupiah · 100% full-weight
8. **Model** — grid 13 model + badge tier (Pro/Free), logo provider, catatan ketersediaan
9. **Harga (ringkas)** — 6 paket Rp10.000–Rp300.000, highlight "Populer" (10M), CTA → `/checkout?plan=`, catatan masa aktif 7 hari
10. **Testimoni** — 2 kutipan (diterjemahkan dari referensi)
11. **FAQ** — 6 tanya-jawab, `<details>` native
12. **CTA akhir** — "Siap ship dengan token lebih murah?" + chip `curl` + 2 CTA
13. **Footer** — kolom link, sosial, © 2026 TOKENIZER

**Dibuang dari referensi (YAGNI)**: changelog teaser (tak ada halaman changelog), value stack (terwakili stats/fitur).

## 4. Halaman Pricing

Hero kecil + grid 6 paket detail + tabel perbandingan (kuota, masa aktif, akses model, support) + catatan harga mengikuti provider + FAQ harga singkat. CTA tiap paket → `/checkout?plan=<id>`.

Paket (sama dengan referensi): 1M Rp10.000 · 5M Rp25.000 · 10M Rp40.000 (Populer) · 20M Rp70.000 · 50M Rp160.000 · 100M Rp300.000. Masa aktif 7 hari.

## 5. Checkout & Order Flow

- **GET `/checkout?plan=`** — form (email wajib; Discord/WhatsApp/Telegram opsional) + ringkasan paket + widget Turnstile; error inline per field; plan tak valid → redirect `/pricing`; checkout tak terkonfigurasi → pesan error graceful
- **POST `/checkout`** — rate limit per IP (429) → validasi email/phone → verifikasi Turnstile → cek konfigurasi → reuse pending order bila ada → buat order (SQLite, id UUID) → `createPayment` bayar.gg → simpan invoice → redirect payment URL; gagal → render ulang form dengan error (400 validasi, 502 gateway)
- **GET `/order/success?order=`** — status: pending (instruksi + info expiry) / paid (API key dikirim ke email) / expired (CTA beli lagi)
- **POST `/api/webhooks/bayar`** — idempoten: parse aman → cari order by invoice → cek expired → re-verify ke bayar.gg (`checkPayment`) → toleransi jumlah bayar → `markPaid` → notif Discord → respon `{success: true}` selalu 200/202

Environment (`.env.example` disediakan): `BAYAR_API_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, `DISCORD_WEBHOOK_URL`, `BASE_URL`, `BUN_DB_PATH` (default `./data/app.sqlite`), `PORT`.

## 6. Lib Backend (port + adaptasi dari referensi)

- `env.ts` — baca env dengan default aman; `isCheckoutConfigured()`
- `plans.ts` — 6 paket (id, name, priceLabel, amountIdr, tokens, duration); `getPlan(id)`
- `validate.ts` — `isValidEmail`, `normalizeEmail`, `normalizePhone`
- `db.ts` — `bun:sqlite` lazy singleton
- `orders.ts` — schema orders (id, planId, planName, amountIdr, tokens, email, discordId?, whatsapp?, telegram?, status pending/paid/expired, invoiceId?, paymentUrl?, createdAt, paidAt?, finalAmountIdr?, discordNotified) + fungsi: `createOrder`, `getOrderById`, `getOrderByInvoice`, `setInvoice`, `expireIfDue`, `markPaid`, `setDiscordNotified`, `isPaidAmountAcceptable`, `findReusablePending`
- `bayar.ts` — `createPayment`, `checkPayment` (fetch API bayar.gg)
- `turnstile.ts` — `verifyTurnstile`
- `discord.ts` — `sendPaidNotification` (embed webhook)
- `rate-limit.ts` — token bucket in-memory per IP

## 7. Testing & Verifikasi

- `bun test` untuk semua lib (sqlite `:memory:`, `fetch` di-mock) — di-port dari test referensi
- `bun run build` (css + client) sukses tanpa error
- Smoke manual: `/`, `/pricing`, `/checkout?plan=10m` render 200; POST checkout tanpa env → error graceful, bukan crash
- Cek visual desktop + mobile (responsif, aksen hijau konsisten, tidak ada elemen slop)

## Kriteria Sukses

1. `bun test` hijau untuk seluruh lib
2. `bun run build && bun start` melayani ketiga halaman + flow checkout (dengan env dummy: error graceful)
3. Visual: terasa seperti Supabase dark — hairline, hijau hemat, tipografi rapi — tanpa satu pun elemen pada daftar anti-slop
4. Seluruh copy Bahasa Indonesia yang natural
