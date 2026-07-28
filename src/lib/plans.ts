export type Plan = {
  id: string;
  name: string;
  tokens: string;
  amountIdr: number;
  priceLabel: string;
  duration: string;
};

const DURATION = "14 hari";

export const PLANS: Plan[] = [
  { id: "1m", name: "1M", tokens: "1M token", amountIdr: 4000, priceLabel: "Rp4.000", duration: DURATION },
  { id: "5m", name: "5M", tokens: "5M token", amountIdr: 25000, priceLabel: "Rp25.000", duration: DURATION },
  { id: "10m", name: "10M", tokens: "10M token", amountIdr: 40000, priceLabel: "Rp40.000", duration: DURATION },
  { id: "20m", name: "20M", tokens: "20M token", amountIdr: 70000, priceLabel: "Rp70.000", duration: DURATION },
  { id: "50m", name: "50M", tokens: "50M token", amountIdr: 160000, priceLabel: "Rp160.000", duration: DURATION },
  { id: "100m", name: "100M", tokens: "100M token", amountIdr: 300000, priceLabel: "Rp300.000", duration: DURATION },
];

export const PLAN_IDS: string[] = PLANS.map((p) => p.id);

export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Format Rupiah dengan pemisah ribuan titik — tanpa bergantung pada ICU. */
export function formatIdr(n: number): string {
  return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Jutaan token dari nama paket ("10M" → 10). */
export function planMillions(plan: Plan): number {
  const m = parseInt(plan.name, 10);
  return Number.isFinite(m) && m > 0 ? m : 1;
}

/** Harga efektif per 1M token. */
export function pricePerMillion(plan: Plan): number {
  return Math.round(plan.amountIdr / planMillions(plan));
}
