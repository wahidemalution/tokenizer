const hits = new Map<string, number[]>();

export function rateLimitOk(
  ip: string,
  opts: { windowMs?: number; max?: number; bucket?: string } = {}
): boolean {
  const windowMs = opts.windowMs ?? 60_000;
  const maxRequests = opts.max ?? 5;
  const key = `${opts.bucket ?? "default"}:${ip || "unknown"}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= maxRequests) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
