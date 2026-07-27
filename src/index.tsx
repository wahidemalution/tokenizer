import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";
import { CheckoutPage } from "./pages/checkout";
import type { CheckoutError } from "./pages/checkout";
import { OrderSuccessPage } from "./pages/order-success";
import { getPlan } from "./lib/plans";
import { getDb } from "./lib/db";
import {
  createOrder,
  getOrderById,
  getOrderByInvoice,
  setInvoice,
  expireIfDue,
  markPaid,
  setDiscordNotified,
  isPaidAmountAcceptable,
  findReusablePending,
} from "./lib/orders";
import { verifyTurnstile } from "./lib/turnstile";
import { createPayment, checkPayment } from "./lib/bayar";
import { sendPaidNotification } from "./lib/discord";
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

app.get("/order/success", (c) => {
  const orderId = c.req.query("order") ?? "";
  if (!orderId) return c.redirect("/");
  const db = getDb();
  let order = getOrderById(db, orderId);
  if (!order) return c.redirect("/");
  order = expireIfDue(db, order);
  const html = renderToString(<OrderSuccessPage order={order} />);
  return c.html(`<!doctype html>${html}`);
});

app.post("/api/webhooks/bayar", async (c) => {
  let payload: any;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ success: true, message: "ignored" }, 200);
  }
  const invoiceId = payload?.invoice_id ? String(payload.invoice_id) : "";
  if (!invoiceId) return c.json({ success: true, message: "ignored" }, 200);

  const db = getDb();
  let order = getOrderByInvoice(db, invoiceId);
  if (!order) {
    console.warn("webhook: invoice not found", invoiceId);
    return c.json({ success: true, message: "ignored" }, 200);
  }

  order = expireIfDue(db, order);
  if (order.status === "expired") {
    console.warn("webhook: late payment for expired order", invoiceId);
    return c.json({ success: true, message: "expired" }, 200);
  }
  if (order.status === "paid" && order.discordNotified) {
    return c.json({ success: true, message: "already-paid" }, 200);
  }

  // Verifikasi ulang ke bayar.gg (body webhook tidak bertanda tangan).
  let verified;
  try {
    verified = await checkPayment(invoiceId);
  } catch (e) {
    console.error("webhook: check-payment error", e);
    return c.json({ success: true, message: "verify-failed" }, 200);
  }
  if (!verified || verified.status !== "paid") {
    return c.json({ success: true, message: "not-paid" }, 202);
  }

  if (!isPaidAmountAcceptable(order.amountIdr, verified.finalAmount)) {
    console.warn("webhook: amount mismatch", {
      invoiceId,
      expected: order.amountIdr,
      finalAmount: verified.finalAmount,
    });
    return c.json({ success: true, message: "amount-mismatch" }, 200);
  }

  const { order: paidOrder, transitioned } = markPaid(
    db,
    order.id,
    verified.paidAt ?? new Date().toISOString(),
    verified.finalAmount ?? null
  );

  if (transitioned || !paidOrder.discordNotified) {
    const discord = await sendPaidNotification(paidOrder);
    if (discord.ok) setDiscordNotified(db, paidOrder.id);
    else console.error("webhook: discord failed", discord.error);
  }

  return c.json({ success: true, message: "paid" }, 200);
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
