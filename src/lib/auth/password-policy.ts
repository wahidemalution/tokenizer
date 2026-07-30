/** Weak / default passwords that must never be used for seed or admin accounts. */
const BLOCKED_PASSWORDS = new Set(
  [
    "change-me-strong",
    "changeme",
    "change-me",
    "password",
    "password123",
    "admin",
    "admin123",
    "12345678",
    "123456789",
    "qwerty123",
    "letmein",
    "tokenizer",
    "tokenizer123",
  ].map((s) => s.toLowerCase())
);

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; reason: "too-short" | "too-weak" | "matches-username" };

export function validateAdminPassword(
  password: string,
  username?: string
): PasswordPolicyResult {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return { ok: false, reason: "too-short" };
  }
  if (BLOCKED_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: "too-weak" };
  }
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return { ok: false, reason: "matches-username" };
  }
  return { ok: true };
}

let dummyHashPromise: Promise<string> | null = null;

/** Real Argon2id hash used only to equalize login timing when user is missing. */
export function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = Bun.password.hash("__timing-pad-not-a-real-password__", {
      algorithm: "argon2id",
    });
  }
  return dummyHashPromise;
}
