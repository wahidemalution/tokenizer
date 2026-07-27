import type { FC, Child } from "hono/jsx";

export const Layout: FC<{
  title: string;
  description?: string;
  headExtra?: Child;
  children: Child;
}> = ({ title, description, headExtra, children }) => {
  return (
    <html lang="id" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0c0c0c" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/app.css" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {headExtra}
      </head>
      <body class="bg-background text-foreground font-sans antialiased">
        {children}
        <script src="/client.js" defer></script>
      </body>
    </html>
  );
};
