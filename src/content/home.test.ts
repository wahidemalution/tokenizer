import { test, expect } from "bun:test";
import { content } from "./home";

test("brand dan tagline terisi", () => {
  expect(content.brand).toBe("TOKENIZER");
  expect(content.tagline.length).toBeGreaterThan(0);
});

test("features punya 7 item bernomor 01-07 dengan body", () => {
  expect(content.features.items).toHaveLength(7);
  content.features.items.forEach((f, i) => {
    expect(String(i + 1).padStart(2, "0")).toBe(f.n);
    expect(f.title.length).toBeGreaterThan(0);
    expect(f.body.length).toBeGreaterThan(0);
  });
});

test("models punya 13 item dengan tier valid", () => {
  expect(content.models.items).toHaveLength(13);
  for (const m of content.models.items) {
    expect(m.name.length).toBeGreaterThan(0);
    expect(m.provider.length).toBeGreaterThan(0);
    expect(["Pro", "Free"]).toContain(m.tier);
  }
});

test("faq punya 6 tanya-jawab non-kosong", () => {
  expect(content.faq.items).toHaveLength(6);
  for (const f of content.faq.items) {
    expect(f.q.length).toBeGreaterThan(0);
    expect(f.a.length).toBeGreaterThan(0);
  }
});

test("badges pricing merujuk plan id yang valid", () => {
  expect(content.pricing.badges.popular.planId).toBe("10m");
  expect(content.pricing.badges.bestValue.planId).toBe("100m");
});

test("tidak ada emoji pada copy UI (anti-slop)", () => {
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
  expect(emojiRe.test(JSON.stringify(content))).toBe(false);
});
