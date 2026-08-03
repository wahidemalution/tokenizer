import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { HomePage } from "./pages/home";
import { PricingPage } from "./pages/pricing";
import { CheckoutPage } from "./pages/checkout";
import type { CheckoutError } from "./pages/checkout";
import { OrderSuccessPage } from "./pages/order-success";
import { TermsPage } from "./pages/terms";
import { PrivacyPage } from "./pages/privacy";
import { RefundPage } from "./pages/refund";
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
import { insertPaymentEvent } from "./lib/payment-events";
import { verifyTurnstile } from "./lib/turnstile";
import { createPayment, checkPayment } from "./lib/bayar";
import { sendPaidNotification } from "./lib/discord";
import { env, isCheckoutConfigured } from "./lib/env";
import { isValidEmail, normalizeEmail, normalizePhone } from "./lib/validate";
import { rateLimitOk } from "./lib/rate-limit";
import { seedAdminIfEmpty } from "./db/seed-admin";
import { adminRoutes } from "./admin/routes";
import { securityHeaders } from "./lib/security-headers";
import { clientIp } from "./lib/client-ip";
import {
  createOrderViewToken,
  verifyOrderViewToken,
} from "./lib/order-view-token";

const WEBHOOK_MAX_BYTES = 64 * 1024;
const WEBHOOK_STORE_MAX_CHARS = 4_096;

function truncateWebhookRaw(value: unknown): unknown {
  try {
    const s = JSON.stringify(value);
    if (s.length <= WEBHOOK_STORE_MAX_CHARS) return value;
    return { truncated: true, preview: s.slice(0, WEBHOOK_STORE_MAX_CHARS) };
  } catch {
    return { truncated: true, preview: "[unserializable]" };
  }
}

const app = new Hono();

app.use("*", securityHeaders);
app.route(env.adminPath, adminRoutes);

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
    <CheckoutPage
      plan={plan}
      errors={errors}
      captchaSiteKey={env.turnstileSiteKey}
      captchaBypass={env.turnstileBypass}
    />
  );
  return c.html(`<!doctype html>${html}`);
});

app.post("/checkout", async (c) => {
  const ip = clientIp(c);
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
      <CheckoutPage
        plan={plan}
        values={values}
        errors={errors}
        captchaSiteKey={env.turnstileSiteKey}
        captchaBypass={env.turnstileBypass}
      />
    );
    return c.html(`<!doctype html>${html}`, 400);
  }

  try {
    const db = getDb();
    const reusable = await findReusablePending(db, email, plan.id);
    if (reusable?.paymentUrl) {
      return c.redirect(reusable.paymentUrl);
    }

    const id = crypto.randomUUID();
    await createOrder(db, {
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
        redirectUrl: `${env.baseUrl}/order/success?order=${id}&t=${createOrderViewToken(id)}`,
      });
      await setInvoice(db, id, result.invoiceId, result.paymentUrl);
      return c.redirect(result.paymentUrl);
    } catch (e) {
      console.error("createPayment failed", e);
      const raw = e instanceof Error ? e.message : String(e);
      const needsHttps =
        /callback_url.*HTTPS|harus menggunakan HTTPS|callback.*https/i.test(raw);
      const message = needsHttps
        ? "bayar.gg mewajibkan PUBLIC_BASE_URL ber-HTTPS untuk callback. Pakai domain HTTPS atau tunnel (cloudflared/ngrok), bukan http://localhost."
        : "Gagal membuat invoice pembayaran. Silakan coba lagi.";
      const html = renderToString(
        <CheckoutPage
          plan={plan}
          values={values}
          errors={[{ message }]}
          captchaSiteKey={env.turnstileSiteKey}
          captchaBypass={env.turnstileBypass}
        />
      );
      return c.html(`<!doctype html>${html}`, 502);
    }
  } catch (e) {
    console.error("checkout db error", e);
    return c.text("Layanan sementara tidak tersedia.", 503);
  }
});

app.get("/order/success", async (c) => {
  const orderId = c.req.query("order") ?? "";
  const viewToken = c.req.query("t") ?? "";
  if (!orderId || !verifyOrderViewToken(orderId, viewToken)) {
    return c.redirect("/");
  }
  try {
    const db = getDb();
    let order = await getOrderById(db, orderId);
    if (!order) return c.redirect("/");
    order = await expireIfDue(db, order);
    const html = renderToString(<OrderSuccessPage order={order} />);
    return c.html(`<!doctype html>${html}`);
  } catch (e) {
    console.error("order success db error", e);
    return c.text("Layanan sementara tidak tersedia.", 503);
  }
});

app.get("/terms", (c) => {
  const html = renderToString(<TermsPage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/privacy", (c) => {
  const html = renderToString(<PrivacyPage />);
  return c.html(`<!doctype html>${html}`);
});

app.get("/refund", (c) => {
  const html = renderToString(<RefundPage />);
  return c.html(`<!doctype html>${html}`);
});

app.post("/api/webhooks/bayar", async (c) => {
  const ip = clientIp(c);
  if (!rateLimitOk(ip, { windowMs: 60_000, max: 60, bucket: "webhook-bayar" })) {
    return c.json({ success: false, message: "rate-limited" }, 429);
  }

  const contentLength = Number(c.req.header("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > WEBHOOK_MAX_BYTES) {
    return c.json({ success: false, message: "payload-too-large" }, 413);
  }

  const db = getDb();
  let raw: unknown = null;
  let payload: Record<string, unknown> | null = null;

  try {
    const text = await c.req.text();
    if (text.length > WEBHOOK_MAX_BYTES) {
      return c.json({ success: false, message: "payload-too-large" }, 413);
    }
    payload = JSON.parse(text) as Record<string, unknown>;
    raw = truncateWebhookRaw(payload);
  } catch {
    raw = { parseError: true };
    await insertPaymentEvent(db, {
      source: "webhook",
      rawBody: raw,
      processedOk: false,
      message: "ignored",
    });
    return c.json({ success: true, message: "ignored" }, 200);
  }

  const invoiceId = payload?.invoice_id ? String(payload.invoice_id) : "";
  if (!invoiceId) {
    await insertPaymentEvent(db, {
      source: "webhook",
      rawBody: raw,
      processedOk: false,
      message: "ignored",
    });
    return c.json({ success: true, message: "ignored" }, 200);
  }

  let order = await getOrderByInvoice(db, invoiceId);
  if (!order) {
    console.warn("webhook: invoice not found", invoiceId);
    await insertPaymentEvent(db, {
      invoiceId,
      source: "webhook",
      rawBody: raw,
      processedOk: false,
      message: "order-not-found",
    });
    return c.json({ success: true, message: "ignored" }, 200);
  }

  order = await expireIfDue(db, order);
  if (order.status === "expired") {
    console.warn("webhook: late payment for expired order", invoiceId);
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      processedOk: false,
      message: "expired",
    });
    return c.json({ success: true, message: "expired" }, 200);
  }
  if (order.status === "paid" && order.discordNotified) {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      processedOk: true,
      message: "already-paid",
    });
    return c.json({ success: true, message: "already-paid" }, 200);
  }

  let verified;
  try {
    verified = await checkPayment(invoiceId);
  } catch (e) {
    console.error("webhook: check-payment error", e);
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      checkResult: null,
      processedOk: false,
      message: "verify-failed",
    });
    return c.json({ success: true, message: "verify-failed" }, 200);
  }

  if (!verified || verified.status !== "paid") {
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      checkResult: verified,
      processedOk: false,
      message: "not-paid",
    });
    return c.json({ success: true, message: "not-paid" }, 202);
  }

  if (!isPaidAmountAcceptable(order.amountIdr, verified.finalAmount)) {
    console.warn("webhook: amount mismatch", {
      invoiceId,
      expected: order.amountIdr,
      finalAmount: verified.finalAmount,
    });
    await insertPaymentEvent(db, {
      orderId: order.id,
      invoiceId,
      source: "webhook",
      rawBody: raw,
      checkResult: verified,
      processedOk: false,
      message: "amount-mismatch",
    });
    return c.json({ success: true, message: "amount-mismatch" }, 200);
  }

  const { order: paidOrder, transitioned } = await markPaid(
    db,
    order.id,
    verified.paidAt ?? new Date().toISOString(),
    verified.finalAmount ?? null
  );

  await insertPaymentEvent(db, {
    orderId: paidOrder.id,
    invoiceId,
    source: "webhook",
    rawBody: raw,
    checkResult: verified,
    processedOk: true,
    message: "paid",
  });

  if (transitioned || !paidOrder.discordNotified) {
    const discord = await sendPaidNotification(paidOrder);
    if (discord.ok) await setDiscordNotified(db, paidOrder.id);
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

const isTestRuntime =
  Bun.env.BUN_TEST === "1" ||
  Bun.env.NODE_ENV === "test" ||
  typeof (globalThis as { bunTest?: unknown }).bunTest !== "undefined";

if (!isTestRuntime && import.meta.main) {
  seedAdminIfEmpty(getDb())
    .then((result) => {
      if (result === "seeded") console.log("Admin user seeded from env");
      if (result === "rejected") {
        console.error("Admin seed rejected — set a strong ADMIN_PASSWORD (min 12 chars)");
      }
    })
    .catch((e) => console.error("Admin seed failed", e));
}

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
