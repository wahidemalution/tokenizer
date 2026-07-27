const windowMs = 60_000;
const maxRequests = 5;
const hits = new Map<string, number[]>();

export function rateLimitOk(ip: string): boolean {
  const key = ip || "unknown";
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
