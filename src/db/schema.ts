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

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    tokens: text("tokens").notNull(),
    basePriceIdr: integer("base_price_idr").notNull(),
    discountPercent: integer("discount_percent").notNull().default(0),
    description: text("description"),
    duration: text("duration").notNull(),
    isPopular: boolean("is_popular").notNull().default(false),
    isLimited: boolean("is_limited").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("plans_active_sort_idx").on(t.isActive, t.sortOrder)]
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const models = pgTable(
  "models",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("available"),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("models_visible_sort_idx").on(t.isVisible, t.sortOrder)]
);
