# Desain: Admin Dashboard + PostgreSQL + Payment Events

Tanggal: 2026-07-29  
Status: Disetujui user (brainstorming)  
Pendekatan: **A — Modular monolit** (satu app Bun + Hono; admin SSR di `/admin/*`)

## Ringkasan

Menambah **dashboard admin** untuk mendata order masuk, memverifikasi pembayaran lewat data webhook/re-check bayar.gg, menandai fulfillment, mengelola user admin, dan statistik ringkas. Database diganti dari **SQLite (`bun:sqlite`)** ke **PostgreSQL via Drizzle ORM** (`DATABASE_URL` dari provider eksternal). Checkout/webhook publik tetap; order **sudah** dipersist hari ini — yang ditambah adalah surface admin, log payment events, auth, dan fulfillment fields.

## Keputusan yang Dikonfirmasi User

| Aspek | Keputusan |
|---|---|
| Auth admin | Username + password (hash kuat); Discord OAuth **opsional nanti** (kolom hook saja) |
| Fitur v1 | List+filter order, detail+webhook log, fulfill/catatan, re-check bayar.gg, stats, setting user |
| DB client | **Drizzle ORM** + PostgreSQL |
| UI admin | SSR Hono + Tailwind (sama stack landing) |
| Arsitektur | Modular monolit, satu deploy |
| Migrasi data SQLite | Tidak auto-import; script opsional terpisah jika dibutuhkan |

## 1. Arsitektur

Stack runtime tetap: **Bun + Hono (`hono/jsx` SSR) + Tailwind v4**. Ganti layer DB saja.

```
src/
├── index.tsx              # mount public + admin routes
├── db/
│   ├── schema.ts          # Drizzle tables
│   ├── client.ts          # drizzle + postgres.js (or bun postgres driver)
│   ├── migrate.ts         # apply migrations on boot / CLI
│   └── seed-admin.ts      # seed first admin from env
├── lib/
│   ├── orders.ts          # rewrite store → Drizzle (API surface mirip existing)
│   ├── payment-events.ts  # insert/list events
│   ├── bayar.ts           # unchanged contract
│   ├── auth/
│   │   ├── password.ts    # argon2id hash/verify
│   │   ├── session.ts     # create/get/destroy sessions
│   │   └── middleware.ts  # requireAdmin
│   └── ...
├── admin/
│   ├── routes.tsx         # Hono sub-app /admin/*
│   ├── layout.tsx         # shell nav + flash
│   └── pages/             # login, dashboard, orders, order-detail, users
└── pages/                 # public pages (existing)
```

**Boot sequence:** connect `DATABASE_URL` → run migrations (or fail loud) → seed admin if zero users and env set → start HTTP.

**Public flow** (`POST /checkout`, `POST /api/webhooks/bayar`, `GET /order/success`) tetap; implementasi store diganti Drizzle. Webhook **selalu** menulis `payment_events` sebelum/bersamaan dengan proses status.

**Out of scope v1:** Discord OAuth login, auto-email API key, multi-tenant, refund otomatis, import bulk SQLite, SPA admin.

## 2. Data model (PostgreSQL / Drizzle)

### 2.1 `orders`

Mirror skema SQLite existing + fulfillment:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `invoice_id` | text unique nullable | bayar.gg |
| `plan_id`, `plan_name`, `tokens` | text | snapshot |
| `amount_idr` | integer | expected |
| `final_amount_idr` | integer nullable | paid (unique code) |
| `email` | text | required |
| `discord_id`, `whatsapp`, `telegram` | text nullable | |
| `status` | text | `pending` \| `paid` \| `expired` |
| `payment_url` | text nullable | |
| `paid_at` | timestamptz nullable | |
| `expires_at` | timestamptz | create + 30m |
| `discord_notified` | boolean default false | |
| `fulfilled_at` | timestamptz nullable | **baru** |
| `fulfillment_note` | text nullable | **baru** |
| `fulfilled_by` | text nullable FK → admin_users.id | **baru** |
| `created_at`, `updated_at` | timestamptz | |

Indexes: `(status, expires_at)`, `(invoice_id)`, `(email)`, `(status, fulfilled_at)` untuk list unfulfilled paid.

Aturan status existing dipertahankan:

- `markPaid` hanya `pending` → `paid`
- `expireIfDue` pada read/webhook
- `isPaidAmountAcceptable`: paid ∈ `[amount_idr, amount_idr + 999]`

### 2.2 `payment_events`

Audit trail webhook & re-check:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `order_id` | text nullable FK | null jika invoice belum match |
| `invoice_id` | text nullable | |
| `source` | text | `webhook` \| `recheck` \| `poll` |
| `raw_body` | jsonb | body masuk (webhook) atau request meta |
| `check_result` | jsonb nullable | hasil `checkPayment` |
| `processed_ok` | boolean | apakah flow sukses menandai paid / expected path |
| `message` | text | human-readable outcome (same family as webhook JSON message) |
| `created_at` | timestamptz | |

Index: `(order_id, created_at desc)`, `(invoice_id)`.

### 2.3 `admin_users`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `username` | text unique | |
| `password_hash` | text | argon2id |
| `role` | text default `admin` | v1 single role; reserved for later |
| `discord_id` | text nullable | **hook OAuth nanti**, tidak dipakai login v1 |
| `is_active` | boolean default true | deactivate tanpa delete |
| `created_at`, `updated_at` | timestamptz | |

### 2.4 `admin_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | random opaque token (cookie value) |
| `user_id` | text FK admin_users | |
| `expires_at` | timestamptz | TTL 7 hari |
| `created_at` | timestamptz | |

Cookie name: `admin_session`. Flags: `HttpOnly`, `SameSite=Lax`, `Secure` when `PUBLIC_BASE_URL` is https. Cookie **Path=`/`** (HttpOnly); value is opaque session id only.

### 2.5 Migrasi & seed

- **Drizzle Kit** migrations committed under `drizzle/`.
- Scripts: `db:generate`, `db:migrate`. Deploy runs **`bun run db:migrate` explicitly** before start. App boot **fail-fast** if required tables missing (no silent auto-migrate on boot).
- **Seed:** on startup, if `admin_users` count = 0 and `ADMIN_USERNAME` + `ADMIN_PASSWORD` set → create one active admin. If users exist, env seed **tidak** overwrite password.
- SQLite file `data/orders.sqlite` di-deprekate; `BUN_DB_PATH` dihapus dari `.env.example`. One-off import script **bukan** bagian v1 wajib.

## 3. Admin UI & routes

Sub-app Hono dimount di `/admin`. Layout: dark netral Tailwind (selaras landing), sidebar/topnav: Dashboard, Orders, Users, Logout.

| Method | Path | Behavior |
|---|---|---|
| GET | `/admin/login` | Form; redirect ke `/admin` jika sudah session valid |
| POST | `/admin/login` | Verify username+password+active; create session; rate limit IP |
| POST | `/admin/logout` | Destroy session + clear cookie |
| GET | `/admin` | Stats cards |
| GET | `/admin/orders` | Table + filters + pagination |
| GET | `/admin/orders/:id` | Detail + events + actions |
| POST | `/admin/orders/:id/fulfill` | body: note; set fulfilled_at/by/note; **only if status = paid** |
| POST | `/admin/orders/:id/unfulfill` | clear fulfill fields |
| POST | `/admin/orders/:id/recheck` | call `checkPayment`; insert payment_event source=recheck; markPaid if rules pass |
| GET | `/admin/users` | list users |
| POST | `/admin/users` | create user (username, password, optional discord_id) |
| POST | `/admin/users/:id/deactivate` | set is_active=false; **forbid self** |
| POST | `/admin/users/:id/activate` | set is_active=true |
| POST | `/admin/users/:id/password` | set new password (admin-only; hash) |

Unauthenticated access to protected routes → `302 /admin/login?next=...`.

### 3.1 Dashboard stats (`GET /admin`)

- Count rows with `status = pending` (operator may trigger expire via detail/recheck; list can also lazy-expire)
- Count `paid` today where `paid_at` falls on calendar day **Asia/Jakarta**
- Sum revenue today: `coalesce(final_amount_idr, amount_idr)` for those paid-today rows
- Count `status = expired`
- Count **unfulfilled paid** (`status = paid` AND `fulfilled_at IS NULL`)

### 3.2 Order list filters

Query params:

- `status`: all \| pending \| paid \| expired
- `fulfilled`: all \| yes \| no (meaningful for paid)
- `q`: substring match email OR invoice_id OR order id (case-insensitive)
- `page`, `per_page` (default 20, max 100)

Sort: `created_at DESC` default.

### 3.3 Order detail

Tampilkan: semua field order, badge status/fulfilled, contacts, timestamps, link payment_url (jika ada).

**Payment events** table chronologic: source, message, processed_ok, created_at, expandable raw_body + check_result JSON.

Actions:

- Fulfill (textarea note) — paid only
- Unfulfill
- Re-check bayar.gg — disabled jika tidak ada invoice_id

### 3.4 Users

Minimal CRUD: create, activate/deactivate, reset password. No self-deactivate. Role fixed `admin` in v1 UI (field exists for future).

## 4. Auth, webhook, errors, testing

### 4.1 Auth

- **Password:** argon2id (prefer Bun native crypto if available; else well-maintained lib). Cost params documented in code constants.
- **Session:** 32+ byte cryptographically random id stored server-side; cookie holds raw id (or `id` only — no user payload in cookie).
- **TTL:** 7 days from creation; optional sliding refresh on activity (nice-to-have; fixed expiry acceptable v1).
- **Login rate limit:** reuse/extend `rate-limit.ts` pattern (e.g. 10 attempts / 15 min per IP).
- Inactive user → login rejected; existing sessions invalidated on deactivate (delete sessions for user_id).

### 4.2 Webhook flow (updated)

```
POST /api/webhooks/bayar
  1. Read raw body; parse JSON if possible (invalid JSON still audited)
  2. Resolve invoice_id from body when present; lookup order; expireIfDue
  3. If invoice_id present: checkPayment(invoice)
  4. Insert ONE payment_events row (source=webhook) with raw_body + check_result + message + processed_ok
     — if no invoice_id: insert raw only, processed_ok=false, skip markPaid
  5. Existing rules: status paid from check, amount acceptable, markPaid, Discord notify
  6. Always HTTP 200/202 JSON success envelope (bayar.gg friendly) — same as today
```

**Rule:** exactly one `payment_events` row per webhook HTTP attempt.

Admin recheck: same markPaid rules; source=`recheck`; actor is admin (message can include username).

### 4.3 Errors

- Missing/invalid `DATABASE_URL` at boot: exit non-zero with clear log
- Runtime DB errors on public checkout: 503 page/JSON
- Admin forms: redirect back with `?error=` or flash cookie short-lived
- Never leak password hashes or full session table in UI

### 4.4 Testing

- **Unit:** password hash/verify; session create/expire; `isPaidAmountAcceptable`; order status transitions against Postgres
- **Integration:** webhook creates payment_event + marks paid; recheck; fulfill/unfulfill; admin middleware redirect
- **DB for tests:** `DATABASE_URL` (or `TEST_DATABASE_URL`) to disposable Postgres. If unset, DB-backed tests **skip** with a clear message. **No SQLite fallback** in app or test harness for the orders path.
- Keep bayar/discord mocked in tests (existing style)

### 4.5 Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes (prod/dev with checkout) | postgres connection string |
| `ADMIN_USERNAME` | seed only | first boot |
| `ADMIN_PASSWORD` | seed only | first boot; strong password |
| `SESSION_SECRET` | optional v1 | reserved if later signed cookies; opaque session id may not need it |
| `PUBLIC_BASE_URL` | existing | Secure cookie heuristic |
| `BAYAR_*`, `DISCORD_*`, `TURNSTILE_*` | existing | unchanged |
| `BUN_DB_PATH` | **removed** | |

`.env.example` updated accordingly.

## 5. Data flow (target)

```
Checkout POST → insert orders (pending) → bayar createPayment → set invoice
     ↓
bayar.gg pay → webhook → payment_events + checkPayment → mark paid → Discord
     ↓
Admin list/detail → see order + events → recheck if needed → fulfill + note
```

## 6. File / dependency impact

**Add:** `drizzle-orm`, `drizzle-kit`, Postgres driver (`postgres` package is common with Drizzle), argon2 (or Bun password API).

**Remove/replace:** `bun:sqlite` usage in `db.ts` / tests; file DB path.

**Refactor:** `orders.ts` API kept as stable as practical (`createOrder`, `getOrderById`, …) so `index.tsx` changes stay thin; add list/filter/stats/fulfill helpers.

## 7. Success criteria

1. App runs only with PostgreSQL; checkout creates rows visible in admin.
2. Webhook and admin recheck append inspectable payment event payloads.
3. Operator can filter paid vs pending, confirm pay via event data, mark fulfilled with note.
4. Multiple admin users manageable; passwords never stored plaintext.
5. Existing amount/status safety rules unchanged.
6. Docs: this spec + later implementation plan; `.env.example` documents Postgres provider usage.

## 8. Non-goals (explicit)

- Customer-facing accounts
- Automated API key provisioning/email
- Discord OAuth (schema hook only)
- Real-time websocket admin
- Multi-currency / non-IDR
- Automatic SQLite → Postgres data migration in deploy path
