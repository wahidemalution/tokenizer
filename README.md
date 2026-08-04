# TOKENIZER Landing

Landing page marketing + checkout + **admin dashboard** untuk TOKENIZER.

Stack: **Bun**, **Hono** (SSR), **Tailwind CSS v4**, **PostgreSQL** (Drizzle ORM), pembayaran **bayar.gg** (QRIS), notifikasi Discord, captcha Cloudflare Turnstile.

## Fitur

- Halaman home, pricing, checkout, order success, legal
- Checkout → invoice bayar.gg → webhook → status `paid` + Discord
- Admin di `{ADMIN_PATH}` (default `/admin`): login, statistik, list/detail order, log webhook, re-check bayar.gg, fulfill, kelola user

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
| `ADMIN_PATH` | tidak | Prefix URL admin (default `/admin`); bisa slug acak/multi-segment, mis. `/secret/nested/panel` |
| `ORDER_VIEW_SECRET` | ya | Secret acak panjang untuk menandatangani link status order; aplikasi menolak start jika kosong |
| `TRUST_PROXY` | ya (production + proxy) | **Wajib `1`** di production: aplikasi selalu di belakang Caddy/Nginx/CDN. Tanpa ini rate-limit menganggap semua pengunjung = 1 client (lihat validasi env saat start). Isi `0` hanya saat akses langsung tanpa proxy |
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
- Admin: `http://localhost:3000{ADMIN_PATH}/login` (default `{ADMIN_PATH}` = `/admin`)

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
- Admin: `http://localhost:3000{ADMIN_PATH}/login` (default `{ADMIN_PATH}` = `/admin`)
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

## Deploy production — Docker Compose + Caddy (disarankan)

Panduan ini untuk **VPS** dengan **Docker Compose** dan **Caddy** sebagai reverse proxy + TLS otomatis (Let's Encrypt).

### Arsitektur target

```
Internet
   │  :80 / :443 (HTTPS, TLS otomatis oleh Caddy)
   ▼
 Caddy (host) ─────► 127.0.0.1:3000 (container app, loopback only)
                          │
                          ▼ (internal Docker network)
                     Postgres 16 (container, loopback only ke host)
```

- App **tidak pernah** terekspos langsung ke internet — hanya Caddy yang publik.
- Semua secret hanya ada di `.env` (tidak di-commit, `git status` bersih).

### 1. Siapkan server

```bash
# Ubuntu/Debian 22.04+ atau 24.04+. Update + upgrade dulu.
sudo apt update && sudo apt upgrade -y

# Install Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # logout/login ulang agar berlaku
docker --version && docker compose version
```

**Firewall (UFW)** — hanya buka yang perlu:

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH        # jangan pernah blokir SSH kamu sendiri
sudo ufw allow 80/tcp         # redirect HTTP→HTTPS oleh Caddy
sudo ufw allow 443/tcp        # HTTPS
# ⛔ JANGAN buka 3000 atau 5432 — app & DB hanya di loopback
sudo ufw enable
sudo ufw status
```

> Kalau pakai provider yang punya firewall terpisah (panel VPS / security group), samakan aturannya di sana.

### 2. Install Caddy (di host, bukan di Compose)

Caddy di host lebih robust (TLS certs & log di `/var/lib/caddy`, restart mandiri via systemd, dan app tetap bisa di-`docker compose down` tanpa menjatuhkan proxy).

```bash
# Repo resmi Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.list.d' | \
  sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Buat `Caddyfile`:

```nginx
# /etc/caddy/Caddyfile
# Ganti domain.com dengan domainmu (subdomain boleh, mis. token.domain.com).
# Caddy auto-mengambil sertifikat Let's Encrypt; HTTPS otomatis.

domain.com {
    # App cuma dengar di 127.0.0.1:3000
    reverse_proxy 127.0.0.1:3000

    # Header forwarding (dibutuhkan TRUST_PROXY=1 di sisi app):
    header_up X-Forwarded-For {remote_host}
    header_up X-Real-IP {remote_host}

    # Lapisan keamanan tambahan di proxy (app juga sudah set sebagian):
    header X-Content-Type-Options nosniff
    header Referrer-Policy strict-origin-when-cross-origin
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl enable caddy
```

> Kalau memakai Cloudflare proxied di depan Caddy, tambahkan `header_up CF-Connecting-IP {remote_host}` — app membaca `CF-Connecting-IP` dulu, lalu `X-Forwarded-For`.

### 3. Clone repo & konfigurasi `.env`

```bash
git clone <repo-url> /opt/tokenizer
cd /opt/tokenizer
cp .env.example .env
chmod 600 .env                 # hanya root/owner yang bisa baca
nano .env
```

Isi minimal untuk production:

```env
# === Wajib: URL publik HTTPS (tanpa slash di akhir) ===
PUBLIC_BASE_URL=https://domain.com

# === Database (bundled) — ganti password kuat! ===
POSTGRES_USER=tokenizer
POSTGRES_PASSWORD=<password-kuat-db>
POSTGRES_DB=tokenizer
POSTGRES_PORT=5432             # tetap loopback
APP_PORT=3000                  # tetap loopback

# === Reverse proxy: WAJIB 1 ===
TRUST_PROXY=1

# === Pembayaran & integrasi ===
BAYAR_GG_API_KEY=<api-key-bayar>
DISCORD_WEBHOOK_URL=<url-webhook-discord>
TURNSTILE_SITE_KEY=<site-key>
TURNSTILE_SECRET_KEY=<secret-key>
# TURNSTILE_BYPASS DIBIARKAN KOSONG di production

# === Admin panel ===
ADMIN_PATH=/<slug-acak-panjang>     # mis. /a7f3k9x1q2w8z — hindari /admin default
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password-min-12-karakter-kuat>

# === Secret tanda tangan link status order (min 16 char) ===
ORDER_VIEW_SECRET=<random>
```

Generate secret dengan perintah di server:

```bash
openssl rand -base64 48    # untuk ORDER_VIEW_SECRET
openssl rand -base64 32    # untuk POSTGRES_PASSWORD
openssl rand -base64 24    # untuk ADMIN_PASSWORD
```

> Aplikasi **menolak start** jika `ORDER_VIEW_SECRET` kosong/placeholder, **menolak seed** jika `ADMIN_PASSWORD` < 12 karakter atau termasuk kata default, dan **menampilkan warning** jika production HTTPS tanpa `TRUST_PROXY=1`.

### 4. Build & start

```bash
docker compose up -d --build
docker compose ps            # db healthy, app running
docker compose logs -f app   # pantau boot & seeding admin pertama
```

Verifikasi dari luar:

```bash
curl -I https://domain.com
# Harus ada: HTTP/2 200, Strict-Transport-Security, X-Content-Type-Options: nosniff

curl -I https://domain.com/api/webhooks/bayar   # reachable dari internet
```

Login admin: `https://domain.com{ADMIN_PATH}/login`.

### 5. Verifikasi pembayaran end-to-end (sebelum go-live)

1. Isi `BAYAR_GG_API_KEY` + `TURNSTILE_*` production (bukan bypass).
2. Checkout paket termurah dengan payment asli.
3. Bayar, tunggu webhook.
4. Pastikan: status order → `paid`, notif Discord masuk, order muncul di dashboard admin.
5. Cek **payment events** di detail order: `source=webhook`, `processedOk=true`, `message=paid`.
6. Jalankan **Fulfill** lalu tandai selesai.

> Jika notifikasi Discord gagal saat webhook (Discord down), order **tetap tercatat `paid`** — dan notifikasi otomatis dicoba ulang saat webhook retry berikutnya, atau lewat tombol **Recheck** di detail order.

### 6. Update aplikasi (setiap rilis)

```bash
cd /opt/tokenizer
git pull
docker compose up -d --build    # migrasi dijalankan otomatis oleh entrypoint
```

### 7. Backup database

```bash
mkdir -p /opt/backups
docker compose exec -T db pg_dump -U tokenizer tokenizer \
  | gzip > /opt/backups/tokenizer-$(date +%F).sql.gz
# + cron/otomasi; simpan backup di luar server (object storage, dsb.)
```

Restore:

```bash
gunzip < backup.sql.gz | docker compose exec -T db psql -U tokenizer tokenizer
```

### 8. Checklist keamanan go-live

- [ ] UFW: hanya `22/80/443` terbuka; `3000` & `5432` loopback (cek `docker compose ps` / `ss -tlnp`)
- [ ] `.env` berisi `TRUST_PROXY=1`, `PUBLIC_BASE_URL` HTTPS, `ORDER_VIEW_SECRET` random
- [ ] `TURNSTILE_BYPASS` kosong, `TURNSTILE_*` production
- [ ] `POSTGRES_PASSWORD` & `ADMIN_PASSWORD` random (bukan `tokenizer`)
- [ ] `ADMIN_PATH` bukan `/admin` default
- [ ] Caddy TLS valid (`curl -I https://domain.com` → 200, HSTS ada)
- [ ] Webhook bayar.gg terverifikasi: `paid` → status berubah → Discord terkirim
- [ ] Backup DB pertama sudah dibuat & diuji restore
- [ ] `docker compose` app jalan sebagai user non-root (`bun`, bukan root)

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
  index.tsx          # public routes + mount {ADMIN_PATH}
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
- Session: cookie `admin_session` HttpOnly, SameSite=Strict, Path={ADMIN_PATH} (default /admin), Secure di HTTPS
- CSRF double-submit (`admin_csrf` + field `_csrf`) pada semua POST admin + login
- Login rate limit per IP; mutasi admin juga di-rate-limit
- Security headers (CSP admin, X-Frame-Options DENY, nosniff, HSTS di HTTPS)
- Seed admin menolak password default (`change-me-strong`, dll.)
- Webhook: re-verify ke bayar.gg (`check-payment`), body webhook tidak dipercaya mentah; jumlah harus cocok persis sebelum status → `paid`

## Lisensi

Private / proprietary — sesuaikan kebijakan repo Anda.
