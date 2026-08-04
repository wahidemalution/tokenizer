import { test, expect } from "bun:test";
import { clientIp } from "./client-ip";
import { withEnv } from "./test-helpers";

function ctx(headers: Record<string, string>) {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return { req: { header: (n: string) => lower[n.toLowerCase()] } };
}

const HTTP = { PUBLIC_BASE_URL: "http://localhost:3000", TRUST_PROXY: undefined };
const HTTPS = { PUBLIC_BASE_URL: "https://tokenizer.test", TRUST_PROXY: "1" };

test("untrusted deployment ignores x-real-ip so rate limits cannot be bypassed", async () => {
  await withEnv(HTTP, () => {
    expect(clientIp(ctx({ "x-real-ip": "10.0.0.1" }))).toBe("direct");
    expect(clientIp(ctx({ "x-real-ip": "10.0.0.2" }))).toBe("direct");
  });
});

test("untrusted deployment ignores CF-Connecting-IP and x-forwarded-for", async () => {
  await withEnv(HTTP, () => {
    expect(clientIp(ctx({ "cf-connecting-ip": "9.9.9.9" }))).toBe("direct");
    expect(clientIp(ctx({ "x-forwarded-for": "9.9.9.8" }))).toBe("direct");
  });
});

test("HTTPS alone does not trust forwarding headers when proxy trust is disabled", async () => {
  await withEnv({ PUBLIC_BASE_URL: "https://tokenizer.test", TRUST_PROXY: undefined }, () => {
    expect(clientIp(ctx({ "cf-connecting-ip": "9.9.9.9" }))).toBe("direct");
    expect(clientIp(ctx({ "x-real-ip": "9.9.9.8" }))).toBe("direct");
  });
});

test("rotating spoofed headers collapse to one bucket when untrusted", async () => {
  await withEnv(HTTP, () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      seen.add(clientIp(ctx({ "x-real-ip": `10.1.0.${i}`, "x-forwarded-for": `10.2.0.${i}` })));
    }
    expect([...seen]).toEqual(["direct"]);
  });
});

test("proxied deployment prefers CF-Connecting-IP", async () => {
  await withEnv(HTTPS, () => {
    expect(
      clientIp(ctx({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" }))
    ).toBe("203.0.113.7");
  });
});

test("proxied deployment falls back to first x-forwarded-for hop", async () => {
  await withEnv(HTTPS, () => {
    expect(clientIp(ctx({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" }))).toBe("203.0.113.9");
  });
});

test("proxied deployment falls back to x-real-ip when no CF/XFF header", async () => {
  await withEnv(HTTPS, () => {
    expect(clientIp(ctx({ "x-real-ip": "203.0.113.5" }))).toBe("203.0.113.5");
  });
});

test("returns direct when no forwarding headers are present", async () => {
  await withEnv(HTTPS, () => {
    expect(clientIp(ctx({}))).toBe("direct");
  });
});
