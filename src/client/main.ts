function initMobileNav() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  if (!toggle || !menu) return;

  const set = (open: boolean) => {
    menu.classList.toggle("hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    toggle.innerHTML = open
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    set(!open);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
}

function initCopy() {
  document.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const text = el.getAttribute("data-copy");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = el.getAttribute("data-copy-label") || "Salin";
        el.setAttribute("data-copy-label", "Tersalin");
        setTimeout(() => el.setAttribute("data-copy-label", original), 1500);
      } catch {}
    });
  });
}

function initScrollReveal() {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  const revealAll = () => els.forEach((el) => el.classList.add("reveal-in"));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealAll();
    return;
  }
  if (!("IntersectionObserver" in window)) {
    revealAll();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}

function initSpotlight() {
  document.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initCopy();
  initScrollReveal();
  initSpotlight();
});
