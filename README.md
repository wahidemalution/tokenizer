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
| `PUBLIC_BASE_URL` | ya (checkout) | URL **HTTPS** publik tanpa trailing slash (bayar.gg menolak callback `http://`) |
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

### Checkout lokal + bayar.gg (HTTPS wajib)

bayar.gg menolak `callback_url` non-HTTPS. `PUBLIC_BASE_URL=http://localhost:3000` **tidak** bisa create invoice.

Opsi dev:

```bash
# Terminal 1: app (compose atau bun)
docker compose up -d

# Terminal 2: tunnel ke port 3000 (contoh cloudflared)
cloudflared tunnel --url http://localhost:3000
# salin URL https://….trycloudflare.com ke PUBLIC_BASE_URL di .env
# lalu: docker compose up -d   # recreate app agar env ter-load
```

Pastikan tunnel mengarah ke app, dan webhook path `/api/webhooks/bayar` reachable dari internet.

Saat boot, jika `admin_users` kosong dan `ADMIN_USERNAME` + `ADMIN_PASSWORD` terisi, user admin pertama di-seed otomatis.

### 5. Test

Butuh Postgres (pakai `DATABASE_URL` atau `TEST_DATABASE_URL`):

```bash
export TEST_DATABASE_URL=postgres://tokenizer:tokenizer@127.0.0.1:5432/tokenizer
bun test
```

Tanpa URL DB, test yang butuh Postgres di-skip.

---

## Docker Compose

Dua opsi database:

| Mode | File | Database |
|---|---|---|
| **Bundled (default)** | `docker-compose.yml` | Container Postgres + volume `pgdata` |
| **External** | `docker-compose.external-db.yml` | Provider luar via `DATABASE_URL` |

### Opsi 1 — App + Postgres di Compose (disarankan self-host)

```bash
cp .env.example .env
# Isi PUBLIC_BASE_URL, BAYAR_*, DISCORD_*, TURNSTILE_*, ADMIN_*
# Ganti POSTGRES_PASSWORD (dan samakan jika pakai DATABASE_URL lokal)

docker compose up -d --build
```

- App: `http://localhost:3000` (atau `APP_PORT`)
- Admin: `http://localhost:3000/admin/login`
- Migrasi dijalankan otomatis di entrypoint container `app`
- `DATABASE_URL` di dalam container **selalu** mengarah ke service `db` (bukan host)

Data Postgres persist di volume Docker `pgdata`. Backup:

```bash
docker compose exec db pg_dump -U tokenizer tokenizer > backup.sql
```

Stop / start:

```bash
docker compose down          # volume tetap ada
docker compose down -v       # hapus data DB (hati-hati)
docker compose up -d --build
```

### Opsi 2 — Hanya app, DB di provider eksternal

```bash
cp .env.example .env
# WAJIB: DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require
# + PUBLIC_BASE_URL, bayar, discord, turnstile, admin

docker compose -f docker-compose.external-db.yml up -d --build
```

Tidak ada service `db`. Pastikan firewall provider mengizinkan IP server/host Docker.

### Build image saja

```bash
docker build -t tokenizer-landing .
docker run --rm -p 3000:3000 --env-file .env tokenizer-landing
```

Entrypoint: `db:migrate` lalu `bun src/index.tsx`.

---

## Deploy production (tanpa Compose)

Urutan di server/CI bare metal / VPS dengan Bun:

### A. Siapkan Postgres

1. Buat database (provider **atau** Postgres di host/Docker terpisah).
2. Set `DATABASE_URL` (SSL bila perlu: `?sslmode=require`).

### B. Environment production

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

- `PUBLIC_BASE_URL` **harus** URL HTTPS publik yang sama dengan yang diakses user (callback bayar.gg + cookie Secure admin).
- Jangan set `TURNSTILE_BYPASS` di production.
- Setelah admin pertama ada, `ADMIN_*` tidak menimpa password yang sudah ada.

### C. Deploy steps (setiap rilis)

```bash
git pull
bun install --frozen-lockfile
bun run db:migrate
bun run build
bun run start
```

Atau pakai **Docker Compose** (bagian di atas) di production: reverse proxy (Caddy/Nginx) → `APP_PORT`.

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

- [ ] `bun run db:migrate` sukses (atau entrypoint Compose)
- [ ] `PUBLIC_BASE_URL` HTTPS benar (dan reachable untuk webhook)
- [ ] Checkout test (amount kecil / sandbox jika ada)
- [ ] Webhook `paid` muncul di admin + Discord
- [ ] Login admin + fulfill order uji
- [ ] Turnstile production keys (bukan bypass)
- [ ] `POSTGRES_PASSWORD` / `ADMIN_PASSWORD` diganti dari default

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
| `docker compose up -d --build` | App + Postgres bundled |
| `docker compose -f docker-compose.external-db.yml up -d --build` | App saja, DB eksternal |

## Struktur singkat

```
src/
  index.tsx          # public routes + mount /admin
  admin/             # dashboard SSR
  db/                # schema, client, migrate, seed
  lib/               # orders, bayar, auth, payment-events, ...
  pages/             # landing pages
drizzle/             # SQL migrations (di-commit)
Dockerfile
docker-compose.yml              # app + db
docker-compose.external-db.yml  # app only
docker/entrypoint.sh
```


## Keamanan (ringkas)

- Password admin: Argon2id (`Bun.password`), min 12 karakter, default lemah ditolak
- Session: cookie `admin_session` HttpOnly, SameSite=Strict, Path=/admin, Secure di HTTPS
- CSRF double-submit (`admin_csrf` + field `_csrf`) pada semua POST admin + login
- Login rate limit per IP; mutasi admin juga di-rate-limit
- Security headers (CSP admin, X-Frame-Options DENY, nosniff, HSTS di HTTPS)
- Seed admin menolak password default (`change-me-strong`, dll.)
- Webhook: re-verify ke bayar.gg + toleransi kode unik amount (+0…999 IDR)

## Lisensi

Private / proprietary — sesuaikan kebijakan repo Anda.
