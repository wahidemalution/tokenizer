import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export const PrivacyPage: FC = () => (
  <Layout title="Kebijakan Privasi — TOKENIZER" description="Bagaimana TOKENIZER mengumpulkan, menggunakan, dan melindungi informasi Anda.">
    <Navbar />
    <main class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Kebijakan Privasi</h1>
        <p class="mt-4 text-muted">Tanggal efektif: 28 Juli 2026</p>
      </div>

      <section class="mt-10 space-y-6" data-reveal>
        <div>
          <h2 class="text-xl font-medium text-foreground">1. Informasi yang Kami Kumpulkan</h2>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li><strong>Informasi Akun:</strong> Nama, alamat email, dan detail kontak yang Anda berikan saat registrasi.</li>
            <li><strong>Informasi Pembayaran:</strong> Detail pembayaran diproses melalui gateway pihak ketiga (bayar.gg). Kami tidak menyimpan nomor kartu kredit atau data finansial sensitif.</li>
            <li><strong>Informasi API Key:</strong> API key yang Anda generate untuk mengakses layanan kami.</li>
            <li><strong>Data Pemakaian:</strong> Statistik pemakaian API, jumlah token yang digunakan, model yang diakses, dan waktu penggunaan.</li>
            <li><strong>Log Server:</strong> Alamat IP, tipe browser, provider internet, dan log akses lainnya untuk keperluan keamanan dan debugging.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Memberikan dan mengelola akun pengguna serta akses API.</li>
            <li>Pemrosesan pembayaran dan aktivasi paket token.</li>
            <li>Mengirim notifikasi penting terkait layanan, faktur, dan perubahan kebijakan.</li>
            <li>Menganalisis pola pemakaian untuk perbaikan layanan dan deteksi penyalahgunaan.</li>
            <li>Keamanan dan pencegahan penipuan.</li>
            <li>Respon terhadap pertanyaan dan dukungan teknis.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">3. Promosi Data untuk Training AI</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            <strong>Tidak pernah.</strong> Prompt dan completion Anda dari API kami tidak digunakan untuk training model AI apa pun. Data Anda tetap sepenuhnya privat dan hanya digunakan untuk memberikan layanan sesuai permintaan Anda.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">4. Berbagi Informasi dengan Pihak Ketiga</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Informasi mungkin dibagikan dalam situasi berikut:
          </p>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Dengan penyedia layanan kami (payment processor, hosting, dll.) yang terikat perjanjian kerahasiaan.</li>
            <li>Jika diwajibkan oleh hukum atau proses legal yang sah.</li>
            <li>Untuk melindungi hak, properti, atau keselamatan TOKENIZER, pengguna, atau publik.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">5. Keamanan Data</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Kami menggunakan standar keamanan industri termasuk enkripsi TLS/SSL untuk transfer data, database terenkripsi, dan akses terbatas berdasarkan kebutuhan. Namun, tidak ada metode transmisi data melalui internet yang 100% aman.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">6. Cookie dan Teknologi Pelacakan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Kami menggunakan cookie minimal untuk fungsionalitas dasar seperti sesi login dan preferensi UI. Anda dapat menolak cookie melalui pengaturan browser Anda, namun hal ini mungkin membatasi beberapa fitur layanan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">7. Penyimpanan Data</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Data disimpan selama akun Anda aktif atau diperlukan untuk menyediakan layanan. Setelah penghapusan akun, data akan dihapus dalam batas waktu maksimal 90 hari, kecuali kewajiban hukum mengharuskan penyimpanan lebih lama.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">8. Hak Privasi Anda</h2>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Akses informasi pribadi yang kami miliki tentang Anda.</li>
            <li>Koreksi informasi yang tidak akurat.</li>
            <li>Penghapusan akun dan data terkait.</li>
            <li>Eksport data Anda dalam format yang dapat dibaca.</li>
            <li>Menyerahkan keberatan terhadap pemrosesan data tertentu.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">9. Anak-anak</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Layanan kami tidak ditujukan untuk anak di bawah usia 13 tahun. Kami tidak secara sengaja mengumpulkan informasi pribadi dari anak-anak. Jika kami mengetahui adanya informasi dari anak di bawah usia, kami akan segera menghapusnya.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">10. Perubahan Kebijakan Privasi</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan material akan diberitahukan via email atau notifikasi dalam aplikasi. Penggunaan lanjutan setelah perubahan menandakan penerimaan terhadap kebijakan baru.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">11. Kontak</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Untuk pertanyaan mengenai privasi, silakan hubungi tim kami di <a href="mailto:privacy@tokenizer.com" class="text-brand hover:underline">privacy@tokenizer.com</a>.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </Layout>
);
