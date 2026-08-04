const hits = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

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
  // Opportunistic cleanup: when at capacity, evict expired buckets only.
  // Never evict an active bucket — otherwise an attacker flooding unrelated
  // keys could flush a blocked rate-limit bucket and reset its counter.
  if (!hits.has(key) && hits.size >= MAX_BUCKETS) {
    for (const [k, ts] of hits) {
      if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

export function _resetRateLimitForTests(): void {
  hits.clear();
}
