import { asc, eq } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { plans, siteSettings } from "../db/schema";
import { content } from "../content/home";

export type Plan = {
  id: string;
  name: string;
  tokens: string;
  basePriceIdr: number;
  discountPercent: number;
  description: string | null;
  duration: string;
  isPopular: boolean;
  isLimited: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Computed final price after discount. */
  amountIdr: number;
  /** Formatted label of amountIdr. */
  priceLabel: string;
};

const DURATION = "14 hari";

/** Seed source for the plans table. Synchronous, in-memory. */
export const PLANS: Plan[] = [
  buildPlan({ id: "1m", name: "1M", tokens: "1M token", basePriceIdr: 10000, discountPercent: 65, duration: DURATION, sortOrder: 1 }),
  buildPlan({ id: "5m", name: "5M", tokens: "5M token", basePriceIdr: 25000, discountPercent: 0, duration: DURATION, sortOrder: 2 }),
  buildPlan({ id: "10m", name: "10M", tokens: "10M token", basePriceIdr: 45000, discountPercent: 0, duration: DURATION, isPopular: true, sortOrder: 3 }),
  buildPlan({ id: "20m", name: "20M", tokens: "20M token", basePriceIdr: 75000, discountPercent: 0, duration: DURATION, sortOrder: 4 }),
  buildPlan({ id: "50m", name: "50M", tokens: "50M token", basePriceIdr: 160000, discountPercent: 0, duration: DURATION, sortOrder: 5 }),
  buildPlan({ id: "100m", name: "100M", tokens: "100M token", basePriceIdr: 300000, discountPercent: 0, duration: DURATION, sortOrder: 6 }),
];

export const PLAN_IDS: string[] = PLANS.map((p) => p.id);

/** Synchronous lookup against the in-memory seed list (no DB). */
export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Format Rupiah dengan pemisah ribuan titik — tanpa bergantung pada ICU. */
export function formatIdr(n: number): string {
  return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Compute the final price after applying discount percent. */
export function computeAmountIdr(basePriceIdr: number, discountPercent: number): number {
  const d = clampInt(discountPercent, 0, 100);
  return Math.round((basePriceIdr * (100 - d)) / 100);
}

/** Jutaan token dari nama paket ("10M" -> 10). */
export function planMillions(plan: Pick<Plan, "name">): number {
  const m = parseInt(plan.name, 10);
  return Number.isFinite(m) && m > 0 ? m : 1;
}

/** Harga efektif per 1M token. */
export function pricePerMillion(plan: Plan): number {
  return Math.round(plan.amountIdr / planMillions(plan));
}

// --- DB-backed reads (async) ---

type PlanRow = typeof plans.$inferSelect;

function rowToPlan(r: PlanRow): Plan {
  const basePriceIdr = r.basePriceIdr;
  const discountPercent = r.discountPercent;
  const amountIdr = computeAmountIdr(basePriceIdr, discountPercent);
  return {
    id: r.id,
    name: r.name,
    tokens: r.tokens,
    basePriceIdr,
    discountPercent,
    description: r.description,
    duration: r.duration,
    isPopular: r.isPopular,
    isLimited: r.isLimited,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
    amountIdr,
    priceLabel: formatIdr(amountIdr),
  };
}

export async function listPlansFromDb(
  db: AppDb,
  opts: { includeInactive?: boolean } = {}
): Promise<Plan[]> {
  const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder), asc(plans.id));
  const filtered = opts.includeInactive ? rows : rows.filter((r) => r.isActive);
  return filtered.map(rowToPlan);
}

export async function getPlanFromDb(db: AppDb, id: string): Promise<Plan | null> {
  const rows = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  if (rows.length === 0) return null;
  const p = rowToPlan(rows[0]);
  return p;
}

export async function getActivePlanFromDb(db: AppDb, id: string): Promise<Plan | null> {
  const p = await getPlanFromDb(db, id);
  if (!p || !p.isActive) return null;
  return p;
}

// --- Mutations ---

export type PlanUpdateInput = {
  name: string;
  tokens: string;
  basePriceIdr: number;
  discountPercent: number;
  description: string | null;
  duration: string;
  isPopular: boolean;
  isLimited: boolean;
  isActive: boolean;
  sortOrder: number;
};

export async function updatePlan(
  db: AppDb,
  id: string,
  input: PlanUpdateInput
): Promise<Plan | null> {
  const now = new Date();
  await db
    .update(plans)
    .set({
      name: input.name.trim(),
      tokens: input.tokens.trim(),
      basePriceIdr: Math.max(0, Math.round(input.basePriceIdr)),
      discountPercent: clampInt(input.discountPercent, 0, 100),
      description: input.description?.trim() ? input.description.trim() : null,
      duration: input.duration.trim(),
      isPopular: input.isPopular,
      isLimited: input.isLimited,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: now,
    })
    .where(eq(plans.id, id));
  return getPlanFromDb(db, id);
}

// --- Pricing section text (site_settings) ---

export const PRICING_TEXT_KEYS = {
  subtitle: "pricing.subtitle",
  note: "pricing.note",
} as const;

export type PricingText = { subtitle: string; note: string };

export async function getPricingText(db: AppDb): Promise<PricingText> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, PRICING_TEXT_KEYS.subtitle))
    .limit(1);
  const subtitle = rows[0]?.value ?? content.pricing.subtitle;
  const noteRows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, PRICING_TEXT_KEYS.note))
    .limit(1);
  const note = noteRows[0]?.value ?? content.pricing.note;
  return { subtitle, note };
}

export async function updatePricingText(
  db: AppDb,
  input: Partial<PricingText>
): Promise<void> {
  const now = new Date();
  const entries: [string, string][] = [];
  if (input.subtitle !== undefined) {
    entries.push([PRICING_TEXT_KEYS.subtitle, input.subtitle]);
  }
  if (input.note !== undefined) {
    entries.push([PRICING_TEXT_KEYS.note, input.note]);
  }
  for (const [key, value] of entries) {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: now },
      });
  }
}

// --- Seed ---

export async function seedPlansIfEmpty(db: AppDb): Promise<"seeded" | "skipped"> {
  const existing = await db.select().from(plans).limit(1);
  if (existing.length > 0) return "skipped";
  const now = new Date();
  await db.insert(plans).values(
    PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      tokens: p.tokens,
      basePriceIdr: p.basePriceIdr,
      discountPercent: p.discountPercent,
      description: p.description,
      duration: p.duration,
      isPopular: p.isPopular,
      isLimited: p.isLimited,
      isActive: true,
      sortOrder: p.sortOrder,
      createdAt: now,
      updatedAt: now,
    }))
  );
  await db.insert(siteSettings).values([
    { key: PRICING_TEXT_KEYS.subtitle, value: content.pricing.subtitle, updatedAt: now },
    { key: PRICING_TEXT_KEYS.note, value: content.pricing.note, updatedAt: now },
  ]);
  return "seeded";
}

// --- helpers ---

function buildPlan(input: {
  id: string;
  name: string;
  tokens: string;
  basePriceIdr: number;
  discountPercent: number;
  description?: string | null;
  duration: string;
  isPopular?: boolean;
  isLimited?: boolean;
  sortOrder: number;
}): Plan {
  const amountIdr = computeAmountIdr(input.basePriceIdr, input.discountPercent);
  return {
    id: input.id,
    name: input.name,
    tokens: input.tokens,
    basePriceIdr: input.basePriceIdr,
    discountPercent: input.discountPercent,
    description: input.description ?? null,
    duration: input.duration,
    isPopular: input.isPopular ?? false,
    isLimited: input.isLimited ?? false,
    isActive: true,
    sortOrder: input.sortOrder,
    amountIdr,
    priceLabel: formatIdr(amountIdr),
  };
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}
