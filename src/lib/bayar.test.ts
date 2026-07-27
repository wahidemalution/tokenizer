import { test, expect } from "bun:test";
import { createPayment, checkPayment } from "./bayar";
import { withEnv, mockFetch } from "./test-helpers";

const CREATE = "https://www.bayar.gg/api/create-payment.php";
const CHECK = "https://www.bayar.gg/api/check-payment.php?invoice=BAYAR-1";

test("createPayment posts and maps response", async () => {
  globalThis.fetch = mockFetch({
    [CREATE]: {
      body: {
        success: true,
        data: {
          invoice_id: "BAYAR-1",
          payment_url: "https://www.bayar.gg/pay?invoice=BAYAR-1",
          final_amount: 40123,
          status: "pending",
          expires_at: "2026-07-23 13:00:00",
        },
      },
    },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await createPayment({
      amount: 40000,
      description: "Tokenizer 10M — a@b.co",
      customerEmail: "a@b.co",
      callbackUrl: "https://x.test/api/webhooks/bayar",
      redirectUrl: "https://x.test/order/success?order=ord-1",
    });
    expect(r.invoiceId).toBe("BAYAR-1");
    expect(r.paymentUrl).toContain("BAYAR-1");
    expect(r.finalAmount).toBe(40123);
    expect(r.status).toBe("pending");
  });
});

test("createPayment throws when success=false", async () => {
  globalThis.fetch = mockFetch({
    [CREATE]: { status: 400, body: { success: false, message: "bad amount" } },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    await expect(
      createPayment({
        amount: 10,
        description: "x",
        callbackUrl: "https://x.test/api/webhooks/bayar",
        redirectUrl: "https://x.test/order/success?order=o",
      })
    ).rejects.toThrow();
  });
});

test("checkPayment returns paid result", async () => {
  globalThis.fetch = mockFetch({
    [CHECK]: {
      body: {
        success: true,
        status: "paid",
        final_amount: 40123,
        paid_at: "2026-07-23 12:30:00",
      },
    },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await checkPayment("BAYAR-1");
    expect(r).not.toBeNull();
    expect(r!.status).toBe("paid");
    expect(r!.finalAmount).toBe(40123);
  });
});

test("checkPayment returns null when not found", async () => {
  globalThis.fetch = mockFetch({
    [CHECK]: { status: 404, body: { success: false } },
  }) as any;
  await withEnv({ BAYAR_GG_API_KEY: "k" }, async () => {
    const r = await checkPayment("BAYAR-1");
    expect(r).toBeNull();
  });
});
