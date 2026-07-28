import type { FC } from "hono/jsx";
import { Layout } from "../server";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";

export const RefundPage: FC = () => (
  <Layout title="Kebijakan Pengembalian Dana — TOKENIZER" description="Panduan pengembalian dana untuk paket token TOKENIZER.">
    <Navbar />
    <main class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div data-reveal>
        <h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Kebijakan Pengembalian Dana</h1>
        <p class="mt-4 text-muted">Tanggal efektif: 28 Juli 2026</p>
      </div>

      <section class="mt-10 space-y-6" data-reveal>
        <div>
          <h2 class="text-xl font-medium text-foreground">1. Ikhtisar Kebijakan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            TOKENIZER menawarkan paket kuota token dengan masa aktif tertentu. Secara umum, karena sifat produk digital yang langsung dapat diakses dan digunakan, <strong>kami tidak memberikan pengembalian dana penuh</strong>. Namun, ada beberapa situasi khusus di mana pertimbangan refund dapat dipertimbangkan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">2. Kriteria Pengembalian Dana</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Permintaan pengembalian dana hanya akan dipertimbangkan dalam kasus berikut:
          </p>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li><strong>Gangguan Teknis Berkepanjangan:</strong> Layanan mengalami downtime {" >"}4 jam berturut-turut pada masa aktif paket Anda yang mengakibatkan tidak dapat mengakses API.</li>
            <li><strong>Pembayaran Ganda yang Tidak Disengaja:</strong> Terjadi kesalahan sistem yang menyebabkan double charging untuk transaksi yang sama.</li>
            <li><strong>Kesalahan Penagihan:</strong> Tagihan yang salah secara material karena error sistem kami (misalnya harga berbeda dari yang ditampilkan).</li>
            <li><strong>Kesalahan Pengguna:</strong> Pembelian yang dilakukan karena salah pilih paket dalam waktu <strong>maksimal 1 jam</strong> setelah transaksi, dengan total pemakaian {"<"}0% dari kuota.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">3. Prosedur Permintaan Refund</h2>
          <ol class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-decimal pl-5">
            <li>Buat tiket dukungan melalui email ke <a href="mailto:support@tokenizer.com" class="text-brand hover:underline">support@tokenizer.com</a> atau Discord server resmi.</li>
            <li>Sertakan detail pesanan (order ID, email akun, tanggal pembelian, alasan refund).</li>
            <li>Dalam kasus gangguan teknis, sertakan bukti/error log jika tersedia.</li>
            <li>Proses review memakan waktu maksimal <strong>5-7 hari kerja</strong>.</li>
            <li>Keputusan refund akan dikomunikasikan via email.</li>
          </ol>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">4. Tidak Termasuk Pengembalian Dana</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">Pengembalian dana tidak diberikan untuk:</p>
          <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted list-disc pl-5">
            <li>Perubahan preferensi pribadi atau kebutuhan bisnis.</li>
            <li>Mulai menggunakan model AI yang berbeda dari yang diharapkan.</li>
            <li>Akses terhadap fitur atau model yang sudah tersedia di paket sebelumnya.</li>
            <li>Permintaan yang dibuat lebih dari <strong>14 hari</strong> setelah pembelian.</li>
            <li>Pembebanan biaya administrasi payment gateway oleh pihak bank/payment processor.</li>
            <li>Penyalahgunaan kuota melebihi batas paket.</li>
            <li>Account termination akibat pelanggaran Ketentuan Layanan.</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">5. Kredit daripada Refund Kas</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Dalam banyak kasus yang memenuhi kriteria refund, TOKENIZER mungkin menawarkan <strong>kredit akun</strong> setara dengan nilai pembayaran sebagai alternatif yang lebih cepat dibandingkan refund kas. Kredit ini dapat digunakan untuk pembelian paket baru kapan saja.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">6. Periode Masa Aktif</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Semua paket memiliki masa aktif <strong>14 hari</strong> dari tanggal pembayaran. Kuota yang tidak terpakai tidak boleh ditransfer ke periode berikutnya, kecuali adanya gangguan sistem yang disengketakan. Masa aktif adalah bagian integral dari penawaran paket—bukan periode pencairan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">7. Pembayaran Melalui Payment Processor</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Kami bekerja dengan bayar.gg sebagai payment processor untuk transaksi QRIS dan e-wallet. Karena sifat transfer dana instan, refund kepada rekening asli biasanya tidak dimungkinkan. Kredit akun adalah opsi utama untuk kompensasi.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">8. Perubahan Kebijakan</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            TOKENIZER berhak mengubah kebijakan pengembalian dana sewaktu-waktu sesuai kondisi operasional. Perubahan penting akan diberitahukan minimal 30 hari sebelum implementasi.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-medium text-foreground">9. Kontak</h2>
          <p class="mt-3 text-sm leading-relaxed text-muted">
            Untuk pertanyaan atau permintaan pengembalian dana, hubungi tim kami melalui:
          </p>
          <ul class="mt-3 space-y-1 text-sm leading-relaxed text-muted">
            <li>Email: <a href="mailto:support@tokenizer.com" class="text-brand hover:underline">support@tokenizer.com</a></li>
            <li>Discord: Join server komunitas TOKENIZER</li>
            <li>Response time target: 24-48 jam kerja</li>
          </ul>
        </div>
      </section>
    </main>
    <Footer />
  </Layout>
);
