# TOKENIZER Landing

Landing page marketing + checkout + **admin dashboard** untuk TOKENIZER.

Stack: **Bun**, **Hono** (SSR), **Tailwind CSS v4**, **PostgreSQL** (Drizzle ORM), pembayaran **bayar.gg** (QRIS), notifikasi Discord, captcha Cloudflare Turnstile.

## Fitur

- Halaman home, pricing, checkout, order success, legal
- Checkout → invoice bayar.gg → webhook → status `paid` + Discord
- Admin di `/admin`: login, statistik, list/detail order, log webhook, re-check bayar.gg, fulfill, kelola user

## Prasyarat

- [Bun](https://bun.sh) (runtime & package manager)
- PostgreSQL (local, Docker, atau provider: Neon, Supabase, Railway, dll.)
- Akun/API: bayar.gg, Discord webhook, Cloudflare Turnstile (untuk checkout production)

## Setup lokal

### 1. Clone & install

```bash
git clone <repo-url>
cd landing-page-kimi
bun install
```

### 2. Environment

```bash
cp .env.example .env
```

Isi minimal:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ya | Connection string Postgres |
| `PUBLIC_BASE_URL` | ya (checkout) | URL publik tanpa trailing slash, mis. `http://localhost:3000` |
| `BAYAR_GG_API_KEY` | ya (checkout) | API key bayar.gg |
| `DISCORD_WEBHOOK_URL` | ya (checkout) | Webhook notifikasi paid |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | ya (checkout) | Cloudflare Turnstile |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | seed | Admin pertama (hanya jika tabel user kosong) |
| `PORT` | tidak | Default `3000` |
| `TURNSTILE_BYPASS=1` | dev saja | Skip captcha di lokal |

Contoh Postgres Docker:

```bash
docker run -d --name tokenizer-pg \
  -e POSTGRES_USER=tokenizer \
  -e POSTGRES_PASSWORD=tokenizer \
  -e POSTGRES_DB=tokenizer \
  -p 5432:5432 postgres:16

# .env
DATABASE_URL=postgres://tokenizer:tokenizer@127.0.0.1:5432/tokenizer
```

### 3. Migrasi database

Jalankan **sebelum** start app (tidak ada auto-migrate saat boot):

```bash
bun run db:migrate
```

### 4. Build assets & jalankan

```bash
bun run build          # CSS + client JS → public/
bun run dev            # hot reload
# atau production-style:
bun run start          # prestart = build, lalu server
```

Buka:

- Landing: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

Saat boot, jika `admin_users` kosong dan `ADMIN_USERNAME` + `ADMIN_PASSWORD` terisi, user admin pertama di-seed otomatis.

### 5. Test

Butuh Postgres (pakai `DATABASE_URL` atau `TEST_DATABASE_URL`):

```bash
export TEST_DATABASE_URL=postgres://tokenizer:tokenizer@127.0.0.1:5432/tokenizer
bun test
```

Tanpa URL DB, test yang butuh Postgres di-skip.

---

## Deploy production

Urutan yang disarankan di server/CI:

### A. Siapkan Postgres

1. Buat database di provider eksternal.
2. Salin connection string ke `DATABASE_URL`  
   (SSL biasanya sudah di URL, mis. `?sslmode=require`).

### B. Environment production

Set di panel host / secrets:

```env
DATABASE_URL=postgres://...
PUBLIC_BASE_URL=https://domain-anda.com
BAYAR_GG_API_KEY=...
DISCORD_WEBHOOK_URL=...
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password-kuat>
PORT=3000
```

Catatan:

- `PUBLIC_BASE_URL` **harus** URL HTTPS publik yang sama dengan yang diakses user (dipakai callback bayar.gg + cookie Secure admin).
- Jangan set `TURNSTILE_BYPASS` di production.
- Setelah admin pertama ada, `ADMIN_*` tidak menimpa password yang sudah ada.

### C. Deploy steps (setiap rilis)

```bash
# 1. Kode
git pull   # atau build image / rsync

# 2. Dependensi
bun install --frozen-lockfile   # atau bun install

# 3. Migrasi schema (wajib sebelum start versi baru)
bun run db:migrate

# 4. Build static assets
bun run build

# 5. Jalankan process
bun run start
# atau: bun src/index.tsx
```

Process manager contoh (systemd / pm2 / Docker): pastikan env ter-load dan process restart on crash.

**Docker one-shot (contoh):**

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
ENV PORT=3000
EXPOSE 3000
# Migrasi di entrypoint, bukan di image build (butuh DATABASE_URL runtime):
CMD ["sh", "-c", "bun run db:migrate && bun src/index.tsx"]
```

### D. Konfigurasi bayar.gg & webhook

1. Dashboard bayar.gg: pastikan API key valid.
2. Checkout mengirim `callback_url` = `{PUBLIC_BASE_URL}/api/webhooks/bayar`.
3. Pastikan URL itu **reachable dari internet** (bukan localhost).
4. Webhook memverifikasi ulang via `check-payment` (body tidak dipercaya mentah).

### E. Admin setelah deploy

1. Buka `https://domain-anda.com/admin/login`
2. Login dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD` (seed pertama)
3. Opsional: buat operator lain di **Users**, lalu ganti password seed
4. Alur ops: **Orders** → filter `paid` / belum fulfilled → detail → cek payment events → **Fulfill** + catatan

### F. Checklist go-live

- [ ] `bun run db:migrate` sukses di production DB
- [ ] `PUBLIC_BASE_URL` HTTPS benar
- [ ] Checkout test (amount kecil / sandbox jika ada)
- [ ] Webhook `paid` muncul di admin + Discord
- [ ] Login admin + fulfill order uji
- [ ] Turnstile production keys (bukan bypass)

---

## Scripts

| Script | Fungsi |
|---|---|
| `bun run dev` | Server watch |
| `bun run build` | Build CSS + client |
| `bun run start` | Build lalu serve |
| `bun run db:migrate` | Terapkan migrasi Drizzle |
| `bun run db:generate` | Generate migrasi dari schema (dev) |
| `bun run db:studio` | Drizzle Studio |
| `bun test` | Test suite |

## Struktur singkat

```
src/
  index.tsx          # public routes + mount /admin
  admin/             # dashboard SSR
  db/                # schema, client, migrate, seed
  lib/               # orders, bayar, auth, payment-events, ...
  pages/             # landing pages
drizzle/             # SQL migrations (di-commit)
```

## Keamanan (ringkas)

- Password admin: Argon2id (`Bun.password`)
- Session: cookie `admin_session` HttpOnly, SameSite=Lax, Secure di HTTPS
- Login rate limit per IP
- Webhook: re-verify ke bayar.gg + toleransi kode unik amount (+0…999 IDR)

## Lisensi

Private / proprietary — sesuaikan kebijakan repo Anda.
