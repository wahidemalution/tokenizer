import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { content } from "../content/home";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { IconCheck, IconX } from "../components/icons";
import { formatIdr } from "../lib/plans";
import type { Order } from "../lib/orders";
import { maskEmail } from "../lib/order-view-token";

export const OrderSuccessPage: FC<{ order: Order }> = ({ order }) => {
  const paid = order.status === "paid";
  const expired = order.status === "expired";
  const emailDisplay = maskEmail(order.email);
  return (
    <Layout title={`Pesanan ${order.planName} — ${content.brand}`} description="Status pesanan token Anda.">
      <Navbar />
      <main class="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        {paid ? (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand">
              <IconCheck size={24} />
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Pembayaran diterima</h1>
            <p class="mt-3 text-muted">
              Terima kasih! Pesanan <strong class="text-foreground">{order.planName}</strong> ({order.tokens}) sedang
              diproses. API key akan dikirim ke <strong class="text-foreground">{emailDisplay}</strong>.
            </p>
          </div>
        ) : expired ? (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
              <IconX size={24} />
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Pesanan kedaluwarsa</h1>
            <p class="mt-3 text-muted">
              Pembayaran tidak selesai dalam 30 menit. Silakan buat pesanan baru.
            </p>
            <a
              href="/pricing"
              class="mt-6 inline-flex h-10 items-center rounded-md bg-brand px-5 text-sm font-medium text-black transition-colors hover:bg-brand-strong"
            >
              Buat pesanan baru
            </a>
          </div>
        ) : (
          <div>
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 font-mono text-xl text-amber-400">
              …
            </div>
            <h1 class="mt-6 text-3xl font-semibold tracking-tight text-foreground">Menunggu pembayaran</h1>
            <p class="mt-3 text-muted">
              Jika Anda sudah membayar, tunggu beberapa saat. Pesanan ini kedaluwarsa otomatis jika tidak dibayar
              dalam 30 menit.
            </p>
          </div>
        )}

        <dl class="mt-8 inline-block text-left text-sm">
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Order ID</dt>
            <dd class="font-mono text-foreground">{order.id}</dd>
          </div>
          {order.invoiceId ? (
            <div class="flex justify-between gap-8 py-1">
              <dt class="text-faint">Invoice</dt>
              <dd class="font-mono text-foreground">{order.invoiceId}</dd>
            </div>
          ) : null}
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Paket</dt>
            <dd class="text-foreground">
              {order.planName} — {order.tokens}
            </dd>
          </div>
          <div class="flex justify-between gap-8 py-1">
            <dt class="text-faint">Harga</dt>
            <dd class="text-foreground">{formatIdr(order.amountIdr)}</dd>
          </div>
        </dl>

        <p class="mt-8">
          <a href="/" class="text-sm text-muted underline underline-offset-4 transition-colors hover:text-foreground">
            Kembali ke beranda
          </a>
        </p>
      </main>
      <Footer />
    </Layout>
  );
};
