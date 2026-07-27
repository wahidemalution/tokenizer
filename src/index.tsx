import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";
import { CheckoutPage } from "./pages/checkout";
import type { CheckoutError } from "./pages/checkout";
import { getPlan } from "./lib/plans";
import { getDb } from "./lib/db";
import { createOrder, setInvoice, findReusablePending } from "./lib/orders";
import { verifyTurnstile } from "./lib/turnstile";
import { createPayment } from "./lib/bayar";
import { env, isCheckoutConfigured } from "./lib/env";
import { isValidEmail, normalizeEmail, normalizePhone } from "./lib/validate";
import { rateLimitOk } from "./lib/rate-limit";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/pricing", (c) => {
  const html = renderToString(<PricingPage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/checkout", (c) => {
  const planId = c.req.query("plan") ?? "";
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");
  const cfg = isCheckoutConfigured();
  const errors: CheckoutError[] = cfg.ok
    ? []
    : [{ message: "Checkout sedang tidak tersedia. Coba lagi nanti." }];
  const html = renderToString(
    <CheckoutPage plan={plan} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
  );
  return c.html(`<!doctype html>${html}`);
});

app.post("/checkout", async (c) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "";
  if (!rateLimitOk(ip)) {
    return c.text("Terlalu banyak permintaan. Coba lagi sebentar.", 429);
  }

  const body = await c.req.parseBody();
  const planId = String(body.plan ?? "");
  const plan = getPlan(planId);
  if (!plan) return c.redirect("/pricing");

  const email = normalizeEmail(String(body.email ?? ""));
  const discordId = String(body.discordId ?? "").trim();
  const whatsappRaw = String(body.whatsapp ?? "").trim();
  const telegram = String(body.telegram ?? "").trim();
  const captchaToken = String(body["cf-turnstile-response"] ?? "");

  const values = { email, discordId, whatsapp: whatsappRaw, telegram };
  const errors: CheckoutError[] = [];

  if (!isValidEmail(email)) errors.push({ field: "email", message: "Email tidak valid." });
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : "";
  if (whatsappRaw && !whatsapp)
    errors.push({ field: "whatsapp", message: "Nomor WhatsApp tidak valid." });

  if (errors.length === 0) {
    const captcha = await verifyTurnstile(captchaToken, c.req.header("CF-Connecting-IP"));
    if (!captcha.success) errors.push({ field: "captcha", message: "Verifikasi captcha gagal." });
  }

  const cfg = isCheckoutConfigured();
  if (!cfg.ok) errors.push({ message: "Checkout belum dikonfigurasi." });

  if (errors.length > 0) {
    const html = renderToString(
      <CheckoutPage plan={plan} values={values} errors={errors} captchaSiteKey={env.turnstileSiteKey} />
    );
    return c.html(`<!doctype html>${html}`, 400);
  }

  const db = getDb();
  const reusable = findReusablePending(db, email, plan.id);
  if (reusable?.paymentUrl) {
    return c.redirect(reusable.paymentUrl);
  }

  const id = crypto.randomUUID();
  createOrder(db, {
    id,
    plan,
    email,
    discordId: discordId || null,
    whatsapp: whatsapp || null,
    telegram: telegram || null,
  });

  try {
    const result = await createPayment({
      amount: plan.amountIdr,
      description: `Tokenizer ${plan.name} — ${email}`,
      customerEmail: email,
      customerPhone: whatsapp || undefined,
      callbackUrl: `${env.baseUrl}/api/webhooks/bayar`,
      redirectUrl: `${env.baseUrl}/order/success?order=${id}`,
    });
    setInvoice(db, id, result.invoiceId, result.paymentUrl);
    return c.redirect(result.paymentUrl);
  } catch (e) {
    console.error("createPayment failed", e);
    const html = renderToString(
      <CheckoutPage
        plan={plan}
        values={values}
        errors={[{ message: "Gagal membuat invoice pembayaran. Silakan coba lagi." }]}
        captchaSiteKey={env.turnstileSiteKey}
      />
    );
    return c.html(`<!doctype html>${html}`, 502);
  }
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
