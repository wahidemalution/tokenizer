import { asc, eq } from "drizzle-orm";
import type { AppDb } from "../db/client";
import { models } from "../db/schema";
import { content } from "../content/home";

export type ModelStatus = "available" | "maintenance" | "error" | "coming-soon";

export type Model = {
  id: string;
  name: string;
  provider: string;
  status: ModelStatus;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const MODEL_STATUSES: ModelStatus[] = [
  "available",
  "maintenance",
  "error",
  "coming-soon",
];

export const MODEL_STATUS_META: Record<
  ModelStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  available: { label: "Available", tone: "success" },
  maintenance: { label: "Maintenance", tone: "warning" },
  error: { label: "Error", tone: "danger" },
  "coming-soon": { label: "Coming Soon", tone: "neutral" },
};

export function isValidModelStatus(s: string): boolean {
  return (MODEL_STATUSES as string[]).includes(s);
}

type ModelRow = typeof models.$inferSelect;

function rowToModel(r: ModelRow): Model {
  return {
    id: r.id,
    name: r.name,
    provider: r.provider,
    status: r.status as ModelStatus,
    isVisible: r.isVisible,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listModelsFromDb(
  db: AppDb,
  opts: { includeHidden?: boolean } = {}
): Promise<Model[]> {
  const rows = await db
    .select()
    .from(models)
    .orderBy(asc(models.sortOrder), asc(models.id));
  const filtered = opts.includeHidden ? rows : rows.filter((r) => r.isVisible);
  return filtered.map(rowToModel);
}

export async function listVisibleModelsFromDb(db: AppDb): Promise<Model[]> {
  const rows = await db
    .select()
    .from(models)
    .where(eq(models.isVisible, true))
    .orderBy(asc(models.sortOrder), asc(models.id));
  return rows.map(rowToModel);
}

export async function getModelFromDb(
  db: AppDb,
  id: string
): Promise<Model | null> {
  const rows = await db
    .select()
    .from(models)
    .where(eq(models.id, id))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToModel(rows[0]);
}

export type ModelCreateInput = {
  name: string;
  provider: string;
  status: ModelStatus;
  isVisible: boolean;
  sortOrder: number;
};

export async function createModel(
  db: AppDb,
  input: ModelCreateInput
): Promise<Model> {
  const now = new Date();
  const id = crypto.randomUUID();
  const status = isValidModelStatus(input.status)
    ? input.status
    : "available";
  await db.insert(models).values({
    id,
    name: input.name.trim(),
    provider: input.provider.trim(),
    status,
    isVisible: input.isVisible,
    sortOrder: Math.max(0, Math.round(input.sortOrder)),
    createdAt: now,
    updatedAt: now,
  });
  const created = await getModelFromDb(db, id);
  if (!created) throw new Error("createModel: row vanished after insert");
  return created;
}

export type ModelUpdateInput = {
  name: string;
  provider: string;
  status: ModelStatus;
  isVisible: boolean;
  sortOrder: number;
};

export async function updateModel(
  db: AppDb,
  id: string,
  input: ModelUpdateInput
): Promise<Model | null> {
  const now = new Date();
  const status = isValidModelStatus(input.status)
    ? input.status
    : "available";
  await db
    .update(models)
    .set({
      name: input.name.trim(),
      provider: input.provider.trim(),
      status,
      isVisible: input.isVisible,
      sortOrder: Math.max(0, Math.round(input.sortOrder)),
      updatedAt: now,
    })
    .where(eq(models.id, id));
  return getModelFromDb(db, id);
}

export async function deleteModel(db: AppDb, id: string): Promise<boolean> {
  const rows = await db.select().from(models).where(eq(models.id, id)).limit(1);
  if (rows.length === 0) return false;
  await db.delete(models).where(eq(models.id, id));
  return true;
}

export async function seedModelsIfEmpty(
  db: AppDb
): Promise<"seeded" | "skipped"> {
  const existing = await db.select().from(models).limit(1);
  if (existing.length > 0) return "skipped";
  const now = new Date();
  await db.insert(models).values(
    content.models.items.map((m, i) => ({
      id: crypto.randomUUID(),
      name: m.name,
      provider: m.provider,
      status: "available" as const,
      isVisible: true,
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now,
    }))
  );
  return "seeded";
}
