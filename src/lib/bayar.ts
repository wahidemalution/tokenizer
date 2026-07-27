import { env } from "./env";

export type CreatePaymentInput = {
  amount: number;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl: string;
  redirectUrl: string;
};

export type CreatePaymentResult = {
  invoiceId: string;
  paymentUrl: string;
  finalAmount?: number;
  status: string;
  expiresAt?: string;
};

export type CheckPaymentResult = {
  status: string;
  finalAmount?: number;
  paidAt?: string;
};

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Key": env.bayarApiKey,
  };
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    description: input.description,
    payment_url: env.bayarPaymentUrl,
    payment_method: env.bayarMethod,
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
  };
  if (input.customerEmail) body.customer_email = input.customerEmail;
  if (input.customerPhone) body.customer_phone = input.customerPhone;

  const res = await fetch(`${env.bayarBaseUrl}/create-payment.php`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.success !== true) {
    throw new Error(`bayar.gg create-payment failed: ${data?.message ?? res.status}`);
  }
  const d = data.data ?? data;
  return {
    invoiceId: d.invoice_id,
    paymentUrl: d.payment_url,
    finalAmount: typeof d.final_amount === "number" ? d.final_amount : undefined,
    status: d.status ?? "pending",
    expiresAt: d.expires_at,
  };
}

export async function checkPayment(invoiceId: string): Promise<CheckPaymentResult | null> {
  const url = `${env.bayarBaseUrl}/check-payment.php?invoice=${encodeURIComponent(invoiceId)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  const data: any = await res.json().catch(() => null);
  if (!data) return null;
  return {
    status: data.status,
    finalAmount: typeof data.final_amount === "number" ? data.final_amount : undefined,
    paidAt: data.paid_at,
  };
}
