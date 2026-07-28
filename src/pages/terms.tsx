import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export const TermsPage: FC = () => (
  <Layout title="Ketentuan Layanan — TOKENIZER" description="Ketentuan dan syarat penggunaan layanan TOKENIZER.">
    <Navbar />
    <main class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Ketentuan Layanan</h1>
        <p class="mt-4 text-muted">Tanggal efektif: 28 Juli 2026</p>
      </div>

      <section class="mt-10 space-y-6" data-reveal>
        <div>
          <h2 class="text-xl font-medium text-foreground">1. Penerimaan Ketentuan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Dengan mengakses atau menggunakan layanan TOKENIZER ("Layanan"), Anda menyetujui untuk terikat oleh ketentuan ini. Jika Anda tidak setuju dengan salah satu bagian dari ketentuan ini, Anda tidak diizinkan menggunakan Layanan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">2. Deskripsi Layanan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            TOKENIZER menyediakan akses ke API gateway yang kompatibel dengan OpenAI, memungkinkan pengguna untuk mengakses berbagai model AI frontier seperti GPT, Claude, Gemini, DeepSeek, dan lainnya melalui satu API terpadu. Layanan ini mencakup manajemen kuota token, pembuatan API key, dan dasbor pemantauan pemakaian.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">3. Akun dan Keamanan</h2>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Anda bertanggung jawab atas kerahasiaan akun dan semua aktivitas yang terjadi di bawah akun Anda.</li>
            <li>Anda harus segera memberitahu TOKENIZER jika ada dugaan penyalahgunaan keamanan akun.</li>
            <li>TOKENIZER berhak menolak, menghentikan, atau menghapus akun yang melanggar ketentuan ini.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">4. Penggunaan yang Dilarang</h2>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Menggunakan Layanan untuk tujuan ilegal atau dilarang oleh hukum setempat.</li>
            <li>Penyalahgunaan sistem, spamming, atau melakukan serangan DoS/DDoS.</li>
            <li>Upaya untuk mengakses atau memanipulasi sistem tanpa otorisasi.</li>
            <li>Produksi atau distribusi konten berbahaya, penipuan, atau pelanggaran hak cipta.</li>
            <li>Penyalahgunaan kuota token melebihi batas yang ditentukan dalam paket yang dibeli.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">5. Hak Kekayaan Intelektual</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Seluruh konten, fitur, dan fungsi Layanan adalah milik dan properti TOKENIZER, dilindungi oleh undang-undang hak cipta dan kekayaan intelektual internasional. Anda tidak boleh menyalin, memodifikasi, mendistribusikan, atau membuat karya turunan tanpa izin tertulis.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">6. Pembatalan dan Pengembalian Dana</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Paket token dapat digunakan sepenuhnya saat pembelian. Pengembalian dana hanya diberikan dalam kasus tertentu sesuai kebijakan pengembalian dana kami. Untuk detail lebih lanjut, lihat <a href="/refund" class="text-brand hover:underline">Kebijakan Pengembalian Dana</a>.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">7. Limitasi Tanggung Jawab</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            TOKENIZER tidak bertanggung jawab atas kerugian langsung atau tidak langsung, kerusakan perangkat, kehilangan data, atau dampak bisnis yang timbul dari penggunaan Layanan. Layanan disediakan "sebagaimana adanya" tanpa jaminan apa pun.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">8. Perubahan Ketentuan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            TOKENIZER berhak mengubah ketentuan ini sewaktu-waktu. Perubahan akan efektif setelah dipublikasikan di halaman ini. Penggunaan Layanan setelah perubahan menandakan penerimaan terhadap ketentuan baru.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">9. Hukum yang Berlaku</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Ketentuan ini diatur oleh hukum Indonesia. Setiap sengketa akan diselesaikan melalui pengadilan yang berwenang di [Kota, Indonesia], kecuali ditentukan lain oleh perjanjian terpisah.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">10. Kontak</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Jika Anda memiliki pertanyaan mengenai ketentuan ini, silakan hubungi kami melalui email di <a href="mailto:support@tokenizer.com" class="text-brand hover:underline">support@tokenizer.com</a> atau melalui Discord server resmi TOKENIZER.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </Layout>
);
