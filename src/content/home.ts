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
    label: "AI Gateway Frontier",
    h1Line1: "Token AI frontier.",
    h1Line2: "Murahnya TOP TIER.",
    sub: "Belasan model AI super power dalam satu API, siap pakai. Kompatibel dengan OpenAI, aktif dalam hitungan menit, mulai dari Rp10.000.",
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
    title: "AI Gateway Tokenizer",
    subtitle: "Satu API untuk model frontier terbaik. Lebih murah, setup cepat, tanpa ganti SDK.",
    cta: { label: "Lihat harga paket", href: "/pricing" },
    items: [
      { n: "01", title: "Model frontier terkemuka", body: "GPT-5, Claude Opus, Gemini, dan model terbaik dunia. Semuanya tersedia dalam 1 platform." },
      { n: "02", title: "Pilih provider sesuka hati", body: "Pakai model dari provider mana pun yang tersedia. Cukup beberapa langkah, tanpa migrasi berat." },
      { n: "03", title: "Promo menarik", body: "Tersedia banyak promo dan event menarik yang membuat token Anda lebih awet dan hemat." },
      { n: "04", title: "Kompatibel dengan OpenAI", body: "Cukup ganti base URL ke api.tokenizer.com. SDK OpenAI yang sudah Anda pakai tetap jalan." },
      { n: "05", title: "Dashboard Usage", body: "Pantau penggunaan token per API key secara real-time di satu dashboard." },
    ],
  },

  models: {
    label: "model",
    title: "Satu API, 14+ model frontier",
    subtitle: "OpenAI GPT 5.X, Claude Opus 5, dan model-model top China. Semua dalam satu API.",
    note: "Daftar model dapat berubah mengikuti ketersediaan dari provider.",
    items: [
      { name: "GPT 5.5", provider: "OpenAI" },
      { name: "GPT 5.4", provider: "OpenAI" },
      { name: "GPT 5.6 Sol", provider: "OpenAI" },
      { name: "GPT 5.6 Terra", provider: "OpenAI" },
      { name: "GPT 5.6 Luna", provider: "OpenAI" },
      { name: "Claude Opus 5", provider: "Anthropic" },
      { name: "Claude Opus 4.6", provider: "Anthropic" },
      { name: "Claude Opus 4.7", provider: "Anthropic" },
      { name: "DeepSeek V4 Pro", provider: "DeepSeek" },
      { name: "DeepSeek V4 Flash", provider: "DeepSeek" },
      { name: "GLM-5.2", provider: "Zhipu AI" },
      { name: "MiniMax M3", provider: "MiniMax" },
      { name: "Kimi K3", provider: "Moonshot" },
    ],
  },

  pricing: {
    label: "harga",
    title: "Pilih paket yang cocok",
    subtitle: "Bayar sesuai kuota dan masa aktif token.",
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
    title: "Disukai pada developer, dan kamu selanjutnya.",
    items: [
      {
        quote: "menunggu review kamu",
        name: "Zeno Rocha",
        role: "Founder · Resend",
        avatar: "https://github.com/zenorocha.png?s=160",
      },
      {
        quote: "menunggu review kamu",
        name: "David Thyresson",
        role: "GP · PWV",
        avatar: "https://github.com/dthyresson.png?s=160",
      },
    ],
  },

  faq: {
    label: "faq",
    title: "Pertanyaanmu, ini jawabannya.",
    items: [
      { q: "Apa bedanya TOKENIZER dengan OpenAI atau Anthropic langsung?", a: "TOKENIZER adalah gateway terpadu ke model frontier, open maupun closed, dengan tarif yang jauh lebih murah. Satu API, banyak provider, tagihan transparan." },
      { q: "Model apa saja yang tersedia?", a: "ChatGPT, Claude, DeepSeek, MiniMax, MiMo, Kimi, GLM, dan lainnya. Vendor baru ditambahkan secara berkala. Lihat daftar lengkap di bagian Model." },
      { q: "Apakah API-nya kompatibel dengan OpenAI?", a: "Ya. Arahkan SDK OpenAI apa pun ke https://api.tokenizer.com/v1 dan langsung berfungsi tanpa mengubah kode." },
      { q: "Bagaimana sistem kuota dan pembayarannya?", a: "Intinya beli token sesuai paket yang tersedia, bayar via qris atau transfer. Langsung gunakan." },
      { q: "Berapa biaya untuk mulai?", a: "Mulai dari Rp4.000 untuk 1M token dengan masa aktif 14 hari. Tanpa kartu kredit, tanpa langganan." },
      { q: "Apakah saya bisa custom topup token?", a: "Bisa. Silahkan hubungi admin, dan berikan informasi jumlah token yang ingin ditambahkan. Proses cepat, dan instant." },
    ],
  },

  finalCta: {
    title: "Siap menggunakan model frontier dengan harga yang lebih murah?",
    sub: "Mulai dari Rp10.000. Tanpa kartu kredit, tanpa langganan.",
    codeChip: "curl https://api.tokenizer.com/v1/models",
    primaryCta: { label: "Dapatkan API key", href: "/pricing" },
    secondaryCta: { label: "Jelajahi model", href: "#model" },
  },

  footer: {
    legal: [
      { label: "Ketentuan Layanan", href: "/terms" },
      { label: "Kebijakan Privasi", href: "/privacy" },
      { label: "Pengembalian Dana", href: "/refund" },
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
