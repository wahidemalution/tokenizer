const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return typeof s === "string" && EMAIL_RE.test(s.trim());
}

export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export function normalizePhone(s: string): string | null {
  if (typeof s !== "string") return null;
  const digits = s.replace(/[\s\-+().]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}
