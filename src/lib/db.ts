import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

function ensureParentDir(path: string): void {
  if (path === ":memory:") return;
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada
  }
}

export function getDb(): Database {
  if (_db) return _db;
  const path = Bun.env.BUN_DB_PATH || "data/orders.sqlite";
  ensureParentDir(path);
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
