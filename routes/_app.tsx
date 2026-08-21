import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en" style="color-scheme: light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Git Lab</title>
        <link
          rel="preconnect"
          href="https://fonts.bunny.net"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap"
        />
      </head>
      <body class="min-h-screen bg-[var(--lg-bg)] text-[var(--lg-text)] antialiased">
        <Component />
      </body>
    </html>
  );
});
