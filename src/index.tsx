import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { renderToString } from "hono/jsx/dom/server";
import { mkdirSync } from "node:fs";
import { HomePage } from "./pages/home";

// pastikan folder data ada untuk path sqlite default (bun:sqlite tidak membuat parent dirs)
if (!Bun.env.BUN_DB_PATH || Bun.env.BUN_DB_PATH !== ":memory:") {
  try {
    mkdirSync("data", { recursive: true });
  } catch {
    // abaikan — mungkin sudah ada atau memakai path :memory:
  }
}

const app = new Hono();

app.use("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));
app.use("/app.css", serveStatic({ path: "./public/app.css" }));
app.use("/client.js", serveStatic({ path: "./public/client.js" }));

app.get("/", (c) => {
  const html = renderToString(<HomePage />);
  return c.html(`<!doctype html>${html}`);
});

app.notFound((c) =>
  c.html(
    '<!doctype html><html lang="id" class="dark"><body style="background:#0c0c0c;color:#ededed;font-family:system-ui"><main style="max-width:40rem;margin:6rem auto;padding:0 1rem"><h1 style="font-size:1.5rem;font-weight:600">404 — Halaman tidak ditemukan</h1><p style="color:#a1a1a1;margin-top:.5rem">Route ini belum tersedia.</p></main></body></html>',
    404
  )
);

export { app };

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
