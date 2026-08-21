import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

const islandsRoot = fileURLToPath(new URL("./islands/", import.meta.url));

/**
 * After HMR, Fresh's collectCss walks module-graph ids like
 * `fresh-island::LessonStudio.tsx`. Vite can load `/@id/fresh-island::LessonStudio`
 * (no extension) but not the `.tsx` form, which 500s every HTML page.
 * Map the stale id onto the real island file.
 */
function freshIslandExtFallback(): Plugin {
  return {
    name: "fresh-island-ext-fallback",
    enforce: "pre",
    resolveId(id) {
      const marker = "fresh-island::";
      const at = id.indexOf(marker);
      if (at === -1) return;
      const spec = id.slice(at + marker.length);
      const match = spec.match(/^(.*)\.(tsx|jsx|ts|js)$/);
      if (!match) return;
      const file = resolve(islandsRoot, `${match[1]}.${match[2]}`);
      if (existsSync(file)) return file;
    },
  };
}

export default defineConfig({
  plugins: [freshIslandExtFallback(), fresh(), tailwindcss()],
  ssr: {
    external: [
      "xterm",
      "xterm-addon-fit",
      "@gitgraph/js",
      "vis-network",
      "vis-data",
    ],
  },
});
