import { env } from "./env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  if (env.turnstileBypass) return { success: true };
  if (!token) return { success: false, error: "captcha-required" };
  if (!env.turnstileSecretKey) return { success: false, error: "captcha-not-configured" };

  const body = new URLSearchParams();
  body.set("secret", env.turnstileSecretKey);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data: any = await res.json();
    if (data?.success === true) return { success: true };
    return { success: false, error: data?.["error-codes"]?.[0] ?? "captcha-failed" };
  } catch (e) {
    return { success: false, error: "captcha-unreachable" };
  }
}
