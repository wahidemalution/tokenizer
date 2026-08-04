// Admin panel client script — external file so admin CSP can stay
// `script-src 'self'` without nonces or 'unsafe-inline'.

function initPricePreview(): void {
  const base = document.getElementById("base_price_idr") as HTMLInputElement | null;
  const disc = document.getElementById("discount_percent") as HTMLInputElement | null;
  const out = document.getElementById("price-preview-value");
  if (!base || !disc || !out) return;
  const fmt = (n: number) =>
    "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const recompute = () => {
    const b = Math.max(0, Number(base.value) || 0);
    const d = Math.max(0, Math.min(100, Number(disc.value) || 0));
    out.textContent = fmt(Math.round((b * (100 - d)) / 100));
  };
  base.addEventListener("input", recompute);
  disc.addEventListener("input", recompute);
}

function initConfirmForms(): void {
  document.querySelectorAll<HTMLFormElement>("form").forEach((f) => {
    const el = f.querySelector<HTMLElement>("[data-confirm]");
    if (!el) return;
    f.addEventListener("submit", (e) => {
      const msg = el.getAttribute("data-confirm");
      if (msg && !confirm(msg)) e.preventDefault();
    });
  });
}

initPricePreview();
initConfirmForms();
