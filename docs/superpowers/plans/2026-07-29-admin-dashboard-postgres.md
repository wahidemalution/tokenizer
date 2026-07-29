# Admin Dashboard + PostgreSQL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate order storage from SQLite to PostgreSQL (Drizzle), persist bayar.gg payment events, and ship an SSR admin dashboard at `/admin/*` for order ops, fulfillment, recheck, stats, and admin users.

**Architecture:** Modular monolit on existing Bun + Hono SSR app. New `src/db/` (Drizzle schema/client/migrate/seed), rewrite `src/lib/orders.ts` to async Drizzle, add `payment-events` + `auth` modules, mount `src/admin/` sub-app. Public checkout/webhook keep the same URLs; webhook always writes one `payment_events` row per attempt.

**Tech Stack:** Bun, Hono ^4.6, Tailwind v4, Drizzle ORM + drizzle-kit, `postgres` (postgres.js), `Bun.password` argon2id, `bun:test`, PostgreSQL via `DATABASE_URL`.

**Spec:** `docs/superpowers/specs/2026-07-29-admin-dashboard-postgres-design.md`

## Global Constraints

- Working directory: `/home/wahid/landing-page-kimi`
- Copy UI admin & flash messages: **Bahasa Indonesia**; code identifiers English
- Anti-slop admin UI: same dark tokens as landing (`background`, `panel`, `brand`, etc.)
- Env names: `DATABASE_URL`, `TEST_DATABASE_URL` (optional), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `PUBLIC_BASE_URL`, existing `BAYAR_*` / `DISCORD_*` / `TURNSTILE_*` / `PORT`. **Remove** `BUN_DB_PATH`
- Password hashing: **`Bun.password` with `algorithm: "argon2id"` only** (no extra argon2 package)
- Orders domain API becomes **async**; callers must `await`
- Domain `Order` timestamps remain **ISO-8601 strings** at the TypeScript boundary (convert from `Date` in mappers)
- Migrasi deploy: explicit `bun run db:migrate` — **no auto-migrate on HTTP boot**
- DB tests: require `TEST_DATABASE_URL` or `DATABASE_URL`; if neither set, **skip** with message — no SQLite fallback
- TDD: failing test → implement → pass → commit per task
- Do not implement Discord OAuth, email API keys, or SQLite data import

## File map

| Path | Responsibility |
|---|---|
| `drizzle.config.ts` | Drizzle Kit config |
| `drizzle/` | Generated SQL migrations (committed) |
| `src/db/schema.ts` | Tables: orders, payment_events, admin_users, admin_sessions |
| `src/db/client.ts` | `getDb()`, `createDb(url)`, close/reset for tests |
| `src/db/migrate.ts` | CLI migrate runner |
| `src/db/seed-admin.ts` | Seed first admin from env |
| `src/db/test-utils.ts` | `withTestDb`, skip helper, truncate |
| `src/lib/orders.ts` | Order CRUD + list/stats/fulfill (Drizzle) |
| `src/lib/payment-events.ts` | Insert/list payment events |
| `src/lib/auth/password.ts` | hash/verify |
| `src/lib/auth/session.ts` | create/get/destroy sessions + cookie helpers |
| `src/lib/auth/middleware.ts` | `requireAdmin` |
| `src/lib/admin-users.ts` | admin user CRUD |
| `src/lib/env.ts` | DATABASE_URL, admin seed getters |
| `src/admin/layout.tsx` | Admin chrome |
| `src/admin/pages/*.tsx` | login, dashboard, orders, detail, users |
| `src/admin/routes.tsx` | Hono sub-app |
| `src/index.tsx` | Mount admin; async checkout/webhook; boot seed |
| `package.json` | deps + `db:*` scripts |
| `.env.example` | new env docs |

---

### Task 1: Dependencies, Drizzle schema, Kit config

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `src/db/schema.ts`
- Modify: `.env.example`
- Modify: `src/lib/env.ts`

**Interfaces:**
- Consumes: —
- Produces: Drizzle table exports `orders`, `paymentEvents`, `adminUsers`, `adminSessions`; `env.databaseUrl`, `env.adminUsername`, `env.adminPassword`, `env.isHttps`

- [ ] **Step 1: Install dependencies**

```bash
cd /home/wahid/landing-page-kimi
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

- [ ] **Step 2: Update `package.json` scripts** (keep existing scripts; add):

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "bun src/db/migrate.ts",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 3: Write `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? "",
  },
});
```

- [ ] **Step 4: Write `src/db/schema.ts`**

```ts
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id"),
    planId: text("plan_id").notNull(),
    planName: text("plan_name").notNull(),
    tokens: text("tokens").notNull(),
    amountIdr: integer("amount_idr").notNull(),
    finalAmountIdr: integer("final_amount_idr"),
    email: text("email").notNull(),
    discordId: text("discord_id"),
    whatsapp: text("whatsapp"),
    telegram: text("telegram"),
    status: text("status").notNull().default("pending"),
    paymentUrl: text("payment_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    discordNotified: boolean("discord_notified").notNull().default(false),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    fulfillmentNote: text("fulfillment_note"),
    fulfilledBy: text("fulfilled_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("orders_invoice_id_uidx").on(t.invoiceId),
    index("orders_status_expires_idx").on(t.status, t.expiresAt),
    index("orders_email_idx").on(t.email),
    index("orders_status_fulfilled_idx").on(t.status, t.fulfilledAt),
  ]
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id"),
    invoiceId: text("invoice_id"),
    source: text("source").notNull(),
    rawBody: jsonb("raw_body").notNull(),
    checkResult: jsonb("check_result"),
    processedOk: boolean("processed_ok").notNull().default(false),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("payment_events_order_created_idx").on(t.orderId, t.createdAt),
    index("payment_events_invoice_idx").on(t.invoiceId),
  ]
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    discordId: text("discord_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("admin_users_username_uidx").on(t.username)]
);

export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
```

- [ ] **Step 5: Extend `src/lib/env.ts`**

Add getters (keep existing):

```ts
get databaseUrl() {
  return get("DATABASE_URL");
},
get adminUsername() {
  return get("ADMIN_USERNAME");
},
get adminPassword() {
  return get("ADMIN_PASSWORD");
},
get isHttps() {
  return this.baseUrl.startsWith("https://");
},
```

Update `isCheckoutConfigured` to also require `DATABASE_URL` in `missing` if empty (checkout needs DB).

- [ ] **Step 6: Replace `.env.example` DB section**

Remove `BUN_DB_PATH`. Add:

```
# PostgreSQL (provider eksternal / local)
DATABASE_URL=postgres://user:pass@host:5432/tokenizer

# Seed admin pertama (hanya jika tabel admin_users kosong)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-strong

# Opsional untuk bun test terhadap Postgres
# TEST_DATABASE_URL=postgres://user:pass@localhost:5432/tokenizer_test
```

- [ ] **Step 7: Commit**

```bash
git add package.json bun.lock drizzle.config.ts src/db/schema.ts src/lib/env.ts .env.example
git commit -m "chore: add drizzle schema and postgres dependencies"
```

---

### Task 2: DB client, migrate CLI, test utils

**Files:**
- Create: `src/db/client.ts`
- Create: `src/db/migrate.ts`
- Create: `src/db/test-utils.ts`
- Create: `src/db/client.test.ts`
- Delete or gut: `src/lib/db.ts` (re-export from client for one release, then remove callers of old API)
- Modify: `src/lib/db.test.ts` → replace with client tests or delete

**Interfaces:**
- Consumes: `src/db/schema.ts`, `env.databaseUrl`
- Produces:
  - `export type AppDb = ReturnType<typeof createDb>`
  - `createDb(url: string): AppDb`
  - `getDb(): AppDb` (lazy singleton from `DATABASE_URL`)
  - `closeDb(): Promise<void>`
  - `_resetDbForTests(url: string): Promise<AppDb>`
  - `getTestDatabaseUrl(): string | null`
  - `describeWithDb(name, fn)` or `skipIfNoDb()`
  - migrate CLI exits 0 on success

- [ ] **Step 1: Write failing test `src/db/client.test.ts`**

```ts
import { test, expect } from "bun:test";
import { getTestDatabaseUrl, createDb, closeSql } from "./test-utils";

const url = getTestDatabaseUrl();

test("createDb can select 1", async () => {
  if (!url) {
    console.warn("SKIP: set TEST_DATABASE_URL or DATABASE_URL for DB tests");
    return;
  }
  const { db, sql } = createDb(url);
  try {
    const rows = await db.execute("select 1 as n");
    // postgres-js/drizzle returns row array-like; assert something ran
    expect(rows).toBeDefined();
  } finally {
    await closeSql(sql);
  }
});
```

Adjust `createDb` return shape in implementation so test matches (export `{ db, sql }` from factory used in tests; singleton `getDb()` returns only `db`).

- [ ] **Step 2: Run test — expect fail (module missing) or skip**

```bash
bun test src/db/client.test.ts
```

- [ ] **Step 3: Implement `src/db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../lib/env";

export type Sql = ReturnType<typeof postgres>;
export type AppDb = ReturnType<typeof drizzle<typeof schema>>;

let _sql: Sql | null = null;
let _db: AppDb | null = null;

export function createDb(url: string): { db: AppDb; sql: Sql } {
  const sql = postgres(url, { max: 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export function getDb(): AppDb {
  if (_db) return _db;
  const url = env.databaseUrl || Bun.env.TEST_DATABASE_URL || "";
  if (!url) throw new Error("DATABASE_URL is required");
  const { db, sql } = createDb(url);
  _sql = sql;
  _db = db;
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}

export async function _resetDbForTests(url: string): Promise<AppDb> {
  await closeDb();
  const { db, sql } = createDb(url);
  _sql = sql;
  _db = db;
  return db;
}
```

- [ ] **Step 4: Implement `src/db/test-utils.ts`**

```ts
import { sql as dsql } from "drizzle-orm";
import { createDb, type AppDb, type Sql } from "./client";
import * as schema from "./schema";

export function getTestDatabaseUrl(): string | null {
  return Bun.env.TEST_DATABASE_URL || Bun.env.DATABASE_URL || null;
}

export { createDb };

export async function closeSql(sql: Sql): Promise<void> {
  await sql.end({ timeout: 5 });
}

export async function truncateAll(db: AppDb): Promise<void> {
  await db.execute(
    dsql`TRUNCATE TABLE payment_events, admin_sessions, orders, admin_users RESTART IDENTITY CASCADE`
  );
}

/** Run migrations using drizzle migrator against url (for tests). */
export async function migrateTestDb(url: string): Promise<void> {
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { db, sql } = createDb(url);
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
  } finally {
    await closeSql(sql);
  }
}
```

- [ ] **Step 5: Implement `src/db/migrate.ts`**

```ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./client";

const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const { db, sql } = createDb(url);
try {
  await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
  console.log("Migrations applied");
} finally {
  await sql.end({ timeout: 5 });
}
```

Fix path resolution for Bun (`import.meta.dir + "/../../drizzle"` is often clearer):

```ts
import { join } from "node:path";
const folder = join(import.meta.dir, "../../drizzle");
await migrate(db, { migrationsFolder: folder });
```

- [ ] **Step 6: Generate first migration**

Requires a reachable Postgres URL (local Docker or provider):

```bash
export DATABASE_URL=postgres://...
bun run db:generate
bun run db:migrate
```

Commit the generated `drizzle/0000_*.sql` and `drizzle/meta/`.

If no DB available in agent environment: still run `db:generate` (generate does not need live DB if credentials empty may warn — set dummy URL only for kit if needed). **Migrations SQL must be committed.**

- [ ] **Step 7: Replace `src/lib/db.ts` with re-exports**

```ts
export { getDb, createDb, closeDb, _resetDbForTests, type AppDb } from "../db/client";
```

Delete obsolete sqlite `openDb`/`migrate` and `src/lib/db.test.ts` sqlite tests (or rewrite to skip).

- [ ] **Step 8: Run client test with DB**

```bash
TEST_DATABASE_URL=... bun test src/db/client.test.ts
```

Expected: PASS (or SKIP if no URL — document in commit message if skipped).

- [ ] **Step 9: Commit**

```bash
git add src/db package.json drizzle drizzle.config.ts src/lib/db.ts
git commit -m "feat: postgres client, migrator, and test helpers"
```

---

### Task 3: Rewrite orders store (Drizzle, async) + tests

**Files:**
- Rewrite: `src/lib/orders.ts`
- Rewrite: `src/lib/orders.test.ts`

**Interfaces:**
- Consumes: `AppDb`, schema `orders`, `Plan`
- Produces (all **async** except pure helpers):

```ts
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
  fulfilledAt: string | null;
  fulfillmentNote: string | null;
  fulfilledBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isPaidAmountAcceptable(orderAmountIdr: number, finalAmountIdr: number | null | undefined): boolean;
export async function createOrder(db: AppDb, input: NewOrderInput): Promise<Order>;
export async function getOrderById(db: AppDb, id: string): Promise<Order | null>;
export async function getOrderByInvoice(db: AppDb, invoiceId: string): Promise<Order | null>;
export async function findReusablePending(db: AppDb, email: string, planId: string): Promise<Order | null>;
export async function expireIfDue(db: AppDb, order: Order): Promise<Order>;
export async function markPaid(db: AppDb, id: string, paidAt: string, finalAmountIdr: number | null): Promise<{ order: Order; transitioned: boolean }>;
export async function setInvoice(db: AppDb, id: string, invoiceId: string, paymentUrl: string): Promise<void>;
export async function setDiscordNotified(db: AppDb, id: string): Promise<void>;
export async function markFulfilled(db: AppDb, id: string, adminUserId: string, note: string | null): Promise<Order | null>;
export async function clearFulfilled(db: AppDb, id: string): Promise<Order | null>;
export type OrderListFilters = {
  status?: "all" | OrderStatus;
  fulfilled?: "all" | "yes" | "no";
  q?: string;
  page?: number;
  perPage?: number;
};
export async function listOrders(db: AppDb, filters: OrderListFilters): Promise<{ rows: Order[]; total: number }>;
export type DashboardStats = {
  pending: number;
  expired: number;
  paidToday: number;
  revenueTodayIdr: number;
  unfulfilledPaid: number;
};
export async function getDashboardStats(db: AppDb, now?: Date): Promise<DashboardStats>;
```

- [ ] **Step 1: Rewrite `orders.test.ts` for Postgres**

Pattern:

```ts
import { test, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { getTestDatabaseUrl, migrateTestDb, truncateAll, createDb, closeSql } from "../db/test-utils";
import type { AppDb } from "../db/client";
import { createOrder, getOrderById, markPaid, /* ... */ isPaidAmountAcceptable } from "./orders";

const url = getTestDatabaseUrl();
let db: AppDb;
let sql: ReturnType<typeof createDb>["sql"];

beforeAll(async () => {
  if (!url) return;
  await migrateTestDb(url);
  const c = createDb(url);
  db = c.db;
  sql = c.sql;
});

beforeEach(async () => {
  if (!url) return;
  await truncateAll(db);
});

afterAll(async () => {
  if (sql) await closeSql(sql);
});

function skip() {
  if (!url) {
    console.warn("SKIP orders tests: no TEST_DATABASE_URL/DATABASE_URL");
    return true;
  }
  return false;
}

test("createOrder inserts pending order", async () => {
  if (skip()) return;
  const o = await createOrder(db, { id: "ord-1", plan, email: "a@b.co" });
  expect(o.status).toBe("pending");
  expect(o.fulfilledAt).toBeNull();
  // expiry ~30m
});

// Port ALL existing behavioral tests from current orders.test.ts to async + skip guard:
// getOrderById, expireIfDue, markPaid idempotent, setInvoice, setDiscordNotified,
// findReusablePending, isPaidAmountAcceptable cases, race expire vs markPaid

test("markFulfilled only when paid", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-f", plan, email: "a@b.co" });
  const pending = await markFulfilled(db, "ord-f", "admin-1", "note");
  expect(pending).toBeNull();
  await markPaid(db, "ord-f", new Date().toISOString(), 40000);
  const ok = await markFulfilled(db, "ord-f", "admin-1", "sent key");
  expect(ok?.fulfilledBy).toBe("admin-1");
  expect(ok?.fulfillmentNote).toBe("sent key");
});

test("listOrders filters by status and q", async () => {
  if (skip()) return;
  await createOrder(db, { id: "a", plan, email: "one@x.co" });
  await createOrder(db, { id: "b", plan, email: "two@x.co" });
  await markPaid(db, "b", new Date().toISOString(), 40000);
  const { rows, total } = await listOrders(db, { status: "paid", q: "two", page: 1, perPage: 20 });
  expect(total).toBe(1);
  expect(rows[0].id).toBe("b");
});

test("getDashboardStats counts paid today Jakarta", async () => {
  if (skip()) return;
  await createOrder(db, { id: "p1", plan, email: "a@b.co" });
  await markPaid(db, "p1", new Date().toISOString(), 40100);
  const s = await getDashboardStats(db);
  expect(s.paidToday).toBeGreaterThanOrEqual(1);
  expect(s.revenueTodayIdr).toBeGreaterThanOrEqual(40100);
  expect(s.unfulfilledPaid).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run tests — fail (orders still sqlite/sync)**

```bash
TEST_DATABASE_URL=... bun test src/lib/orders.test.ts
```

- [ ] **Step 3: Implement `src/lib/orders.ts` with Drizzle**

Key implementation notes:

- `rowToOrder`: map drizzle row; `paidAt?.toISOString() ?? null`; `discordNotified` boolean as-is
- `createOrder`: `insert(orders).values({... dates as Date ...})`
- `markPaid`: `update ... where id and status=pending` then re-fetch; `transitioned` from `result.rowCount` (postgres-js: check returning or re-read status)
- Prefer `.returning()` on updates when available
- `listOrders`: `and()`, `ilike` for q on email/invoice/id; count query + limit/offset
- `getDashboardStats`: use SQL with timezone `Asia/Jakarta` for “today” bounds:

```ts
// Compute start/end of today in Asia/Jakarta as Date objects in JS, filter paidAt range
function jakartaDayRange(now = new Date()): { start: Date; end: Date } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const day = fmt.format(now); // YYYY-MM-DD
  // Parse as Jakarta midnight: use Temporal if available, else:
  const start = new Date(`${day}T00:00:00+07:00`);
  const end = new Date(`${day}T23:59:59.999+07:00`);
  return { start, end };
}
```

- `markFulfilled`: update only if `status = 'paid'`; set fulfilledAt=now, fulfilledBy, fulfillmentNote
- `clearFulfilled`: set those three null

Keep `isPaidAmountAcceptable` identical.

- [ ] **Step 4: Run tests — PASS**

```bash
TEST_DATABASE_URL=... bun test src/lib/orders.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders.ts src/lib/orders.test.ts
git commit -m "feat: rewrite orders store on drizzle postgres"
```

---

### Task 4: Payment events module

**Files:**
- Create: `src/lib/payment-events.ts`
- Create: `src/lib/payment-events.test.ts`

**Interfaces:**

```ts
export type PaymentEventSource = "webhook" | "recheck" | "poll";
export type PaymentEvent = {
  id: string;
  orderId: string | null;
  invoiceId: string | null;
  source: PaymentEventSource;
  rawBody: unknown;
  checkResult: unknown | null;
  processedOk: boolean;
  message: string;
  createdAt: string;
};
export type NewPaymentEventInput = {
  id?: string;
  orderId?: string | null;
  invoiceId?: string | null;
  source: PaymentEventSource;
  rawBody: unknown;
  checkResult?: unknown | null;
  processedOk: boolean;
  message: string;
};
export async function insertPaymentEvent(db: AppDb, input: NewPaymentEventInput): Promise<PaymentEvent>;
export async function listPaymentEventsForOrder(db: AppDb, orderId: string): Promise<PaymentEvent[]>;
```

- [ ] **Step 1: Failing tests**

```ts
test("insertPaymentEvent and list by order", async () => {
  if (skip()) return;
  await createOrder(db, { id: "ord-pe", plan, email: "a@b.co" });
  await insertPaymentEvent(db, {
    orderId: "ord-pe",
    invoiceId: "INV-1",
    source: "webhook",
    rawBody: { invoice_id: "INV-1" },
    checkResult: { status: "paid" },
    processedOk: true,
    message: "paid",
  });
  const list = await listPaymentEventsForOrder(db, "ord-pe");
  expect(list).toHaveLength(1);
  expect(list[0].message).toBe("paid");
  expect(list[0].source).toBe("webhook");
});
```

- [ ] **Step 2: Implement module** — `insert` with `crypto.randomUUID()`, `createdAt: new Date()`, order by `createdAt asc` for list.

- [ ] **Step 3: Tests pass → commit**

```bash
git commit -m "feat: add payment_events store"
```

---

### Task 5: Auth — password, session, admin users

**Files:**
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/password.test.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/session.test.ts`
- Create: `src/lib/admin-users.ts`
- Create: `src/lib/admin-users.test.ts`
- Create: `src/db/seed-admin.ts`

**Interfaces:**

```ts
// password.ts
export async function hashPassword(plain: string): Promise<string>; // Bun.password.hash(plain, { algorithm: "argon2id" })
export async function verifyPassword(plain: string, hash: string): Promise<boolean>;

// session.ts
export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export async function createSession(db: AppDb, userId: string): Promise<{ id: string; expiresAt: Date }>;
export async function getSessionUser(db: AppDb, sessionId: string | undefined): Promise<AdminUserPublic | null>;
export async function destroySession(db: AppDb, sessionId: string): Promise<void>;
export async function destroySessionsForUser(db: AppDb, userId: string): Promise<void>;
export function sessionCookieOptions(expiresAt: Date): { httpOnly: true; path: "/"; sameSite: "Lax"; secure: boolean; expires: Date };

// admin-users.ts
export type AdminUserPublic = { id: string; username: string; role: string; discordId: string | null; isActive: boolean; createdAt: string };
export async function createAdminUser(db, { username, password, discordId? }): Promise<AdminUserPublic>;
export async function findAdminByUsername(db, username): Promise<(AdminUserPublic & { passwordHash: string }) | null>;
export async function listAdminUsers(db): Promise<AdminUserPublic[]>;
export async function setAdminActive(db, id, isActive): Promise<void>;
export async function setAdminPassword(db, id, password): Promise<void>;
export async function countAdminUsers(db): Promise<number>;

// seed-admin.ts
export async function seedAdminIfEmpty(db: AppDb): Promise<"seeded" | "skipped">;
```

- [ ] **Step 1: password tests** (no DB)

```ts
test("hash and verify argon2id", async () => {
  const h = await hashPassword("secret-pass");
  expect(h.startsWith("$argon2id$")).toBe(true);
  expect(await verifyPassword("secret-pass", h)).toBe(true);
  expect(await verifyPassword("wrong", h)).toBe(false);
});
```

- [ ] **Step 2: Implement password.ts → pass**

- [ ] **Step 3: session + admin-users tests with DB**

```ts
test("createSession and getSessionUser", async () => {
  if (skip()) return;
  const u = await createAdminUser(db, { username: "ops", password: "pass-long-1" });
  const s = await createSession(db, u.id);
  const got = await getSessionUser(db, s.id);
  expect(got?.username).toBe("ops");
  await destroySession(db, s.id);
  expect(await getSessionUser(db, s.id)).toBeNull();
});

test("deactivate clears sessions", async () => {
  if (skip()) return;
  const u = await createAdminUser(db, { username: "x", password: "pass-long-1" });
  await createSession(db, u.id);
  await setAdminActive(db, u.id, false);
  await destroySessionsForUser(db, u.id);
  // ensure no sessions
});

test("seedAdminIfEmpty seeds once", async () => {
  if (skip()) return;
  Bun.env.ADMIN_USERNAME = "seedadmin";
  Bun.env.ADMIN_PASSWORD = "seed-pass-strong";
  expect(await seedAdminIfEmpty(db)).toBe("seeded");
  expect(await seedAdminIfEmpty(db)).toBe("skipped");
});
```

- [ ] **Step 4: Implement session, admin-users, seed-admin**

Session id: `Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")`.

`getSessionUser`: join session+user where expiresAt > now and isActive; optionally delete expired.

`seedAdminIfEmpty`: if count=0 and both env set, createAdminUser; if missing env and count=0, log warning, return skipped.

- [ ] **Step 5: Tests pass → commit**

```bash
git commit -m "feat: admin auth password, sessions, users, seed"
```

---

### Task 6: Wire public checkout + webhook to Postgres + payment events

**Files:**
- Modify: `src/index.tsx` (checkout POST, success GET, webhook)
- Rewrite: `src/index.test.ts`
- Create: `src/lib/auth/middleware.ts` (optional here; used Task 7)
- Modify boot: call `seedAdminIfEmpty(getDb())` before serve (in default export init or top-level await)

**Interfaces:**
- Webhook always `insertPaymentEvent` once per attempt with outcome message matching previous JSON `message` values where possible: `ignored`, `expired`, `already-paid`, `verify-failed`, `not-paid`, `amount-mismatch`, `paid`, plus `order-not-found`
- `processedOk: true` only for terminal success paths that are “fine”: `paid`, `already-paid` (and optionally expired handled cleanly). Spec: processed_ok = flow sukses menandai paid / expected path — use `true` for `paid` and `already-paid`; `false` otherwise

- [ ] **Step 1: Update `index.test.ts`** to use migrate + truncate + async orders; remove `BUN_DB_PATH`; set `DATABASE_URL`/`TEST_DATABASE_URL` in withEnv; fix `seedOrder` to async; assert payment event created on webhook paid.

```ts
test("webhook paid inserts payment_event and marks order", async () => {
  if (skip()) return;
  // seed order + invoice, mock checkPayment paid
  const res = await postWebhook("INV");
  expect(res.status).toBe(200);
  const events = await listPaymentEventsForOrder(db, "ord-paid");
  expect(events.some((e) => e.message === "paid")).toBe(true);
});
```

Port existing webhook cases (spoof amount, underpay, double notify, expired).

- [ ] **Step 2: Run — fail on sync API / sqlite**

- [ ] **Step 3: Update `src/index.tsx`**

Checkout:

```ts
const db = getDb();
const reusable = await findReusablePending(db, email, plan.id);
// ...
await createOrder(db, { ... });
await setInvoice(db, id, result.invoiceId, result.paymentUrl);
```

Success page: `await getOrderById`, `await expireIfDue`.

Webhook rewrite (structure):

```ts
app.post("/api/webhooks/bayar", async (c) => {
  const db = getDb();
  let raw: unknown = null;
  let payload: any = null;
  try {
    payload = await c.req.json();
    raw = payload;
  } catch {
    raw = { parseError: true };
    await insertPaymentEvent(db, {
      source: "webhook",
      rawBody: raw,
      processedOk: false,
      message: "ignored",
    });
    return c.json({ success: true, message: "ignored" }, 200);
  }
  const invoiceId = payload?.invoice_id ? String(payload.invoice_id) : "";
  if (!invoiceId) {
    await insertPaymentEvent(db, { source: "webhook", rawBody: raw, processedOk: false, message: "ignored" });
    return c.json({ success: true, message: "ignored" }, 200);
  }

  let order = await getOrderByInvoice(db, invoiceId);
  // ... expire, already-paid short circuits: still insert event with checkResult if you call check, or without
  // Prefer: always checkPayment when order found and not (paid&&notified) path needs verify;
  // For already-paid&&notified: insert event message already-paid processedOk true, no check required
  // For missing order: insert event order-not-found

  let verified = null;
  try {
    verified = await checkPayment(invoiceId);
  } catch {
    await insertPaymentEvent(db, {
      orderId: order?.id ?? null,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      checkResult: null,
      processedOk: false,
      message: "verify-failed",
    });
    return c.json({ success: true, message: "verify-failed" }, 200);
  }

  // amount / status branches each insertPaymentEvent then return

  const { order: paidOrder, transitioned } = await markPaid(...);
  await insertPaymentEvent(db, {
    orderId: paidOrder.id,
    invoiceId,
    source: "webhook",
    rawBody: raw,
    checkResult: verified,
    processedOk: true,
    message: "paid",
  });
  // discord...
  return c.json({ success: true, message: "paid" }, 200);
});
```

Ensure **exactly one** event insert per request (every return path inserts once).

- [ ] **Step 4: Boot seed** at bottom of `index.tsx`:

```ts
if (import.meta.main) {
  // bun serves via default export; use top-level:
}
// After app defined:
try {
  const db = getDb();
  const result = await seedAdminIfEmpty(db);
  if (result === "seeded") console.log("Admin user seeded from env");
} catch (e) {
  console.error("DB boot check failed", e);
  // Do not exit if only tests import app — only exit when running as server.
}
```

Safer: only seed when `import.meta.main` or when `Bun.env.SEED_ON_BOOT !== "0"`. For Bun default export server, use:

```ts
const isServer = typeof Bun !== "undefined" && Bun.main === import.meta.path;
```

Or document that ops runs seed via migrate hook. Spec says seed on startup — implement:

```ts
export default {
  port: Number(Bun.env.PORT ?? 3000),
  async fetch(req: Request) {
    return app.fetch(req);
  },
};
```

And top-level:

```ts
if (Bun.env.BUN_TEST !== "1") {
  seedAdminIfEmpty(getDb()).catch((e) => console.error(e));
}
```

Tests set nothing special; getDb in tests uses test URL via `_resetDbForTests`.

- [ ] **Step 5: All webhook/order integration tests pass**

```bash
TEST_DATABASE_URL=... bun test src/index.test.ts src/lib/orders.test.ts
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: postgres-backed checkout webhook with payment events"
```

---

### Task 7: Admin middleware + login/logout UI

**Files:**
- Create: `src/lib/auth/middleware.ts`
- Create: `src/admin/layout.tsx`
- Create: `src/admin/pages/login.tsx`
- Create: `src/admin/routes.tsx` (login/logout + placeholder home)
- Modify: `src/index.tsx` — `app.route("/admin", adminApp)` careful with path prefix
- Create: `src/admin/routes.test.ts` (login redirect, bad password)
- Extend rate limit: `src/lib/rate-limit.ts` add `loginRateLimitOk(ip)` 10 / 15 min **or** parameterized `rateLimitOk(ip, { windowMs, max })`

**Interfaces:**
- `requireAdmin` middleware sets `c.set("adminUser", AdminUserPublic)`
- Hono variables type augmentation optional

- [ ] **Step 1: Parameterize rate limit**

```ts
export function rateLimitOk(
  ip: string,
  opts: { windowMs?: number; max?: number; bucket?: string } = {}
): boolean {
  const windowMs = opts.windowMs ?? 60_000;
  const maxRequests = opts.max ?? 5;
  const key = `${opts.bucket ?? "default"}:${ip || "unknown"}`;
  // same Map logic
}
```

Update checkout call sites to still work (defaults).

- [ ] **Step 2: middleware**

```ts
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getDb } from "../db/client";
import { getSessionUser, SESSION_COOKIE } from "./session";

export const requireAdmin = createMiddleware(async (c, next) => {
  const db = getDb();
  const sid = getCookie(c, SESSION_COOKIE);
  const user = await getSessionUser(db, sid);
  if (!user) {
    const nextUrl = encodeURIComponent(c.req.path);
    return c.redirect(`/admin/login?next=${nextUrl}`);
  }
  c.set("adminUser", user);
  await next();
});
```

- [ ] **Step 3: `AdminLayout` + `LoginPage`** (Bahasa Indonesia, dark)

Login form: POST `/admin/login` fields username, password; show error query.

- [ ] **Step 4: routes login**

```ts
import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { renderToString } from "hono/jsx/dom/server"; // same as src/index.tsx
```

```ts
const admin = new Hono();

admin.get("/login", async (c) => { /* if session → /admin ; else LoginPage */ });
admin.post("/login", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "unknown";
  if (!rateLimitOk(ip, { windowMs: 15 * 60_000, max: 10, bucket: "admin-login" })) {
    return c.redirect("/admin/login?error=rate");
  }
  const body = await c.req.parseBody();
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  const row = await findAdminByUsername(getDb(), username);
  if (!row || !row.isActive || !(await verifyPassword(password, row.passwordHash))) {
    return c.redirect("/admin/login?error=auth");
  }
  const session = await createSession(getDb(), row.id);
  setCookie(c, SESSION_COOKIE, session.id, sessionCookieOptions(session.expiresAt));
  const next = c.req.query("next");
  const dest = next && next.startsWith("/admin") ? next : "/admin";
  return c.redirect(dest);
});
admin.post("/logout", requireAdmin, async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) await destroySession(getDb(), sid);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.redirect("/admin/login");
});

admin.get("/", requireAdmin, async (c) => {
  // temporary simple OK page until Task 8
  return c.html(`<!doctype html>${renderToString(<AdminLayout title="Dashboard" user={c.get("adminUser")}><p>OK</p></AdminLayout>)}`);
});

export { admin as adminRoutes };
```

Mount: `app.route("/admin", adminRoutes)` — note Hono joins paths so routes use `/login` not `/admin/login`.

- [ ] **Step 5: Integration test**

```ts
test("GET /admin redirects to login", async () => {
  if (skip()) return;
  const res = await app.fetch(new Request("http://x/admin"));
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("/admin/login");
});

test("login success sets cookie", async () => {
  if (skip()) return;
  await createAdminUser(db, { username: "admin", password: "correct-horse" });
  const res = await app.fetch(new Request("http://x/admin/login", {
    method: "POST",
    body: new URLSearchParams({ username: "admin", password: "correct-horse" }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    redirect: "manual",
  }));
  expect(res.status).toBe(302);
  expect(res.headers.get("set-cookie") || "").toContain("admin_session=");
});
```

- [ ] **Step 6: Pass → commit**

```bash
git commit -m "feat: admin login session and middleware"
```

---

### Task 8: Admin dashboard stats page

**Files:**
- Create: `src/admin/pages/dashboard.tsx`
- Modify: `src/admin/routes.tsx` GET `/`

- [ ] **Step 1: Dashboard page** showing cards: Pending, Paid hari ini, Revenue hari ini (Rp formatted), Expired, Belum fulfilled.

Use `getDashboardStats(getDb())`. Format IDR with `Intl.NumberFormat("id-ID")`.

- [ ] **Step 2: Manual/dev check or light test that GET `/admin` with session returns 200 and contains “Pending”**

Helper `async function authedFetch(path)` that logs in first.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: admin dashboard stats"
```

---

### Task 9: Admin orders list

**Files:**
- Create: `src/admin/pages/orders.tsx`
- Modify: `src/admin/routes.tsx` GET `/orders`

- [ ] **Step 1: Orders table UI** with query filters `status`, `fulfilled`, `q`, `page`. Form GET. Columns: created, email, plan, amount, status, fulfilled, invoice (short), link detail.

- [ ] **Step 2: Route**

```ts
admin.get("/orders", requireAdmin, async (c) => {
  const status = (c.req.query("status") as any) || "all";
  const fulfilled = (c.req.query("fulfilled") as any) || "all";
  const q = c.req.query("q") || "";
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const { rows, total } = await listOrders(getDb(), { status, fulfilled, q, page, perPage: 20 });
  const html = renderToString(
    <AdminLayout title="Orders" user={c.get("adminUser")}>
      <OrdersPage rows={rows} total={total} page={page} filters={{ status, fulfilled, q }} />
    </AdminLayout>
  );
  return c.html(`<!doctype html>${html}`);
});
```

- [ ] **Step 3: Test list shows seeded paid order email**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: admin orders list with filters"
```

---

### Task 10: Order detail — events, fulfill, unfulfill, recheck

**Files:**
- Create: `src/admin/pages/order-detail.tsx`
- Modify: `src/admin/routes.tsx`
- Create: `src/lib/admin-order-actions.ts` (optional pure orchestration for recheck) **or** inline in routes
- Test: recheck marks paid + inserts event source=recheck; fulfill/unfulfill

**Interfaces:**

```ts
export async function recheckOrderPayment(
  db: AppDb,
  orderId: string,
  actorUsername: string
): Promise<{ message: string; order: Order | null }>;
```

Logic mirrors webhook markPaid rules; `insertPaymentEvent` source `recheck`; message includes actor.

- [ ] **Step 1: Tests for recheckOrderPayment + fulfill routes**

```ts
test("recheck marks paid when bayar says paid", async () => {
  if (skip()) return;
  // create pending with invoice, mock checkPayment
  const result = await recheckOrderPayment(db, "ord-1", "admin");
  expect(result.message).toBe("paid");
  const events = await listPaymentEventsForOrder(db, "ord-1");
  expect(events.at(-1)?.source).toBe("recheck");
});
```

- [ ] **Step 2: Implement recheck helper + detail page**

Detail shows all order fields, events table (`<pre>` for JSON), forms:

- POST fulfill: `note`
- POST unfulfill
- POST recheck

- [ ] **Step 3: Routes**

```ts
admin.get("/orders/:id", requireAdmin, ...);
admin.post("/orders/:id/fulfill", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.parseBody();
  const note = String(body.note ?? "");
  const user = c.get("adminUser");
  const order = await markFulfilled(getDb(), id, user.id, note || null);
  if (!order) return c.redirect(`/admin/orders/${id}?error=fulfill`);
  return c.redirect(`/admin/orders/${id}?ok=fulfilled`);
});
// unfulfill, recheck similarly
```

- [ ] **Step 4: Pass → commit**

```bash
git commit -m "feat: admin order detail fulfill and bayar recheck"
```

---

### Task 11: Admin users settings

**Files:**
- Create: `src/admin/pages/users.tsx`
- Modify: `src/admin/routes.tsx`

- [ ] **Step 1: Users page** — table username, active, created; form create (username, password, discord_id optional); buttons activate/deactivate/password change.

- [ ] **Step 2: Routes** with guards:

- deactivate: if `id === c.get("adminUser").id` → error `cannot-self-deactivate`
- create: validate username non-empty, password length >= 8
- password: length >= 8

- [ ] **Step 3: Tests for self-deactivate forbidden + create user**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: admin user management"
```

---

### Task 12: Polish — nav, env docs, remove sqlite leftovers, full test run

**Files:**
- Modify: `src/admin/layout.tsx` — nav links Dashboard, Orders, Users, Logout
- Delete dead sqlite code paths / `data/` references in README if any
- Grep for `bun:sqlite`, `BUN_DB_PATH`, `discord_notified === 1`
- Update any README only if exists (do not create unsolicited)
- Ensure `isCheckoutConfigured` lists DATABASE_URL

- [ ] **Step 1: Grep cleanup**

```bash
rg "bun:sqlite|BUN_DB_PATH|orders\\.sqlite" -n .
```

Fix all hits.

- [ ] **Step 2: Full test suite**

```bash
TEST_DATABASE_URL=... bun test
```

Expected: all pass or intentional skips only when URL missing (CI without DB).

- [ ] **Step 3: Manual smoke checklist (document in commit body)**

1. `bun run db:migrate`
2. set ADMIN_* + DATABASE_URL
3. `bun run dev` → `/admin/login`
4. create checkout order (or insert) → visible in `/admin/orders`
5. simulate webhook → event on detail
6. fulfill

- [ ] **Step 4: Final commit**

```bash
git commit -m "chore: finish admin dashboard postgres migration cleanup"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Postgres + Drizzle | 1–2 |
| orders + fulfillment columns | 1, 3 |
| payment_events | 4, 6, 10 |
| admin_users / sessions | 5, 7, 11 |
| Seed admin env | 5–6 |
| Stats Asia/Jakarta | 3, 8 |
| List/filter/pagination | 3, 9 |
| Detail + webhook log | 10 |
| Fulfill / unfulfill | 3, 10 |
| Recheck bayar.gg | 10 |
| User settings | 11 |
| Auth argon2id + cookie 7d | 5, 7 |
| Login rate limit | 7 |
| No auto-migrate boot; explicit CLI | 2 |
| Webhook one event/attempt | 6 |
| Remove BUN_DB_PATH | 1, 12 |
| SSR Hono Tailwind admin | 7–11 |
| Discord OAuth out of scope | — (discord_id column only) |

**Type consistency:** `AppDb` from client; `Order` ISO strings; async orders throughout; `SESSION_COOKIE = "admin_session"`.

**Placeholders:** none intentional; agent must fill migration SQL via `drizzle-kit generate` in Task 2 (tool-generated, not hand-waved empty).

---

## Execution notes

- Prefer real Postgres (Docker: `docker run -d --name tok-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tokenizer -p 5432:5432 postgres:16` → `postgres://postgres:postgres@localhost:5432/tokenizer`).
- After Task 6, public site **requires** DATABASE_URL even for read-only marketing if `getDb()` is called only on checkout — marketing routes should not call getDb (current design OK).
- Hono `app.route("/admin", admin)` — do not double-prefix `/admin` inside sub-app.
