export const content = {
  brand: "TOKENIZER",
  tagline: "Token AI frontier. Satu API. Murah.",

  nav: {
    links: [
      { label: "Fitur", href: "/#fitur" },
      { label: "Model", href: "/#model" },
      { label: "Harga", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
    cta: { label: "Dapatkan API key", href: "/pricing" },
  },

  announcement: {
    enabled: false,
    text: "Deal model frontier — DeepSeek 4×, MiniMax 2.7×, MiMo hemat 99%",
    href: "/pricing",
  },

  hero: {
    label: "gateway token frontier",
    h1Line1: "Token AI frontier.",
    h1Line2: "Murahnya TOP TIER.",
    sub: "Belasan model AI super power dalam satu API, siap pakai — kompatibel dengan OpenAI, aktif dalam hitungan menit, mulai dari Rp10.000.",
    primaryCta: { label: "Dapatkan API key", href: "/pricing" },
    secondaryCta: { label: "Lihat model", href: "#model" },
    codeFile: "ai-tokenizer.py",
  },

  logoStrip: {
    label: "SATU API, 13+ MODEL FRONTIER",
    providers: [
      { slug: "openai", name: "OpenAI" },
      { slug: "anthropic", name: "Anthropic" },
      { slug: "deepseek", name: "DeepSeek" },
      { slug: "zhipu", name: "Zhipu AI" },
      { slug: "minimax", name: "MiniMax" },
      { slug: "qwen", name: "Qwen" },
      { slug: "kimi", name: "Moonshot" },
    ],
  },

  features: {
    label: "kenapa tokenizer",
    title: "Gateway token frontier",
    subtitle: "Ship, stream, scale — tetap murah.",
    cta: { label: "Lihat harga paket", href: "/pricing" },
    items: [
      { n: "01", title: "Model frontier", body: "DeepSeek, MiniMax, MiMo, dan lainnya — full-weight, tidak pernah dikuantisasi diam-diam." },
      { n: "02", title: "Multi-provider", body: "Satu API, banyak backend. Ganti model tanpa menulis ulang kode." },
      { n: "03", title: "Kredit yang awet", body: "Promo dan kredit gratis membuat setiap rupiah berlipat ganda." },
      { n: "04", title: "Kompatibel dengan OpenAI", body: "Base URL drop-in. Arahkan SDK Anda ke api.tokenizer.com dan ship." },
      { n: "05", title: "Latensi rendah", body: "Routing yang efisien menjaga first-token latency tetap rendah." },
      { n: "06", title: "Kuota transparan", body: "Limit jelas dan tagihan transparan — tanpa invoice kejutan." },
      { n: "07", title: "Dasbor & API key", body: "Key per proyek, grafik pemakaian, dan tim dalam satu konsol." },
    ],
  },

  comparison: {
    label: "sebelum / sesudah",
    without: {
      title: "Tanpa TOKENIZER",
      points: [
        "Harga list per-token yang mahal",
        "Terkunci di satu ekosistem",
        "Tagihan dan kuota tidak transparan",
        "Invoice kejutan saat scale",
      ],
    },
    with: {
      title: "Dengan TOKENIZER",
      points: [
        "Model frontier dengan harga murah",
        "Satu API, banyak provider",
        "Dasbor pemakaian yang transparan",
        "Kredit yang berlipat hingga 100×",
      ],
    },
  },

  stats: {
    items: [
      { value: "10×", label: "lebih murah", body: "Dibanding harga list big-lab." },
      { value: "2×", label: "setup lebih cepat", body: "Satu base URL, ganti SDK dalam hitungan menit." },
      { value: "5×", label: "lebih jauh per rupiah", body: "Promo kredit memperpanjang setiap sen." },
      { value: "100%", label: "model full-weight", body: "Tidak pernah dikuantisasi diam-diam." },
    ],
  },

  models: {
    label: "model",
    title: "Satu API, 13+ model frontier",
    subtitle: "OpenAI GPT 5.X, Claude, dan model-model top China — dalam satu API.",
    note: "Daftar model dapat berubah mengikuti ketersediaan dari provider.",
    items: [
      { name: "GPT 5.5", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.4", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Sol", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Terra", provider: "OpenAI", tier: "Pro" },
      { name: "GPT 5.6 Luna", provider: "OpenAI", tier: "Pro" },
      { name: "Claude Opus 4.6", provider: "Anthropic", tier: "Pro" },
      { name: "Claude Opus 4.7", provider: "Anthropic", tier: "Pro" },
      { name: "DeepSeek V4 Pro", provider: "DeepSeek", tier: "Pro" },
      { name: "DeepSeek V4 Flash", provider: "DeepSeek", tier: "Free" },
      { name: "GLM-5.2", provider: "Zhipu AI", tier: "Pro" },
      { name: "MiniMax M3", provider: "MiniMax", tier: "Pro" },
      { name: "Qwen 3.8", provider: "Alibaba Qwen", tier: "Pro" },
      { name: "Kimi K3", provider: "Moonshot", tier: "Pro" },
    ],
  },

  pricing: {
    label: "harga",
    title: "Pilih paket yang cocok",
    subtitle: "Bayar sesuai kuota dan masa aktif token. Top-up kapan saja.",
    note: "Harga token dapat berubah sewaktu-waktu mengikuti harga dari provider.",
    perMillion: "per 1M token",
    durationLabel: "Masa aktif",
    ctaLabel: "Mulai sekarang",
    badges: {
      popular: { planId: "10m", label: "Populer" },
      bestValue: { planId: "100m", label: "Best value" },
    },
  },

  testimonials: {
    label: "komunitas",
    title: "Disukai developer. Founder juga.",
    items: [
      {
        quote: "TOKENIZER memangkas tagihan token kami 80%. Kualitas frontier yang sama, dengan biaya yang jauh lebih kecil. Kami berhenti membandingkan provider.",
        name: "Zeno Rocha",
        role: "Founder · Resend",
        avatar: "https://github.com/zenorocha.png?s=160",
      },
      {
        quote: "Provider pertama yang membuat saya percaya open model di production. Harness-nya sangat solid, sampai saya harus memastikan ulang bahwa saya masih memakai DeepSeek Flash.",
        name: "David Thyresson",
        role: "GP · PWV",
        avatar: "https://github.com/dthyresson.png?s=160",
      },
    ],
  },

  faq: {
    label: "faq",
    title: "Pertanyaan, terjawab.",
    items: [
      { q: "Apa bedanya TOKENIZER dengan OpenAI atau Anthropic langsung?", a: "TOKENIZER adalah gateway terpadu ke model frontier — open maupun closed — dengan tarif yang jauh lebih murah. Satu API, banyak provider, tagihan transparan." },
      { q: "Model apa saja yang tersedia?", a: "DeepSeek, MiniMax, MiMo, Qwen, Kimi, GLM, dan lainnya. Vendor baru ditambahkan secara berkala — lihat daftar lengkap di bagian Model." },
      { q: "Apakah API-nya kompatibel dengan OpenAI?", a: "Ya. Arahkan SDK OpenAI apa pun ke https://api.tokenizer.com/v1 dan langsung berfungsi tanpa mengubah kode." },
      { q: "Apakah data saya dipakai untuk training?", a: "Tidak, tidak pernah. Prompt dan completion Anda tidak digunakan untuk training sama sekali." },
      { q: "Bagaimana sistem kuota dan pembayarannya?", a: "Beli paket kuota sesuai kebutuhan, bayar via QRIS atau e-wallet, dan top-up kapan saja. Kuota makin awet dipakai di model yang lebih murah." },
      { q: "Berapa biaya untuk mulai?", a: "Mulai dari Rp10.000 untuk 1M token dengan masa aktif 7 hari. Tanpa kartu kredit, tanpa langganan." },
    ],
  },

  finalCta: {
    title: "Siap ship dengan token yang lebih murah?",
    sub: "Mulai dari Rp10.000 — tanpa kartu kredit, tanpa langganan.",
    codeChip: "curl https://api.tokenizer.com/v1/models",
    primaryCta: { label: "Dapatkan API key", href: "/pricing" },
    secondaryCta: { label: "Jelajahi model", href: "#model" },
  },

  footer: {
    columns: [
      {
        title: "Produk",
        links: [
          { label: "Fitur", href: "/#fitur" },
          { label: "Model", href: "/#model" },
          { label: "Harga", href: "/pricing" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
    ],
    socials: [
      { label: "X", icon: "x", href: "https://x.com/" },
      { label: "GitHub", icon: "github", href: "https://github.com/" },
      { label: "Discord", icon: "discord", href: "https://discord.com/" },
    ],
    copyright: "© 2026 TOKENIZER. Seluruh hak cipta dilindungi.",
  },
} as const;

export type Content = typeof content;
