import { assertEquals } from "@std/assert";
import { unwrapGitgraph } from "@/lib/graph/gitgraph_load.ts";

function fakeCreate() {
  return {
    branch: () => ({}),
    tag: () => ({}),
    import: () => ({}),
    clear: () => ({}),
  };
}

Deno.test("unwrapGitgraph reads named ESM exports", () => {
  const mod = unwrapGitgraph({
    createGitgraph: fakeCreate,
    templateExtend: (name: unknown) => name,
    TemplateName: { Metro: "metro" },
  });
  assertEquals(typeof mod?.createGitgraph, "function");
  assertEquals(mod?.TemplateName.Metro, "metro");
});

Deno.test("unwrapGitgraph reads default and nested default (Vite UMD interop)", () => {
  const inner = {
    createGitgraph: fakeCreate,
    templateExtend: (name: unknown) => name,
    TemplateName: { Metro: "metro" },
  };
  const fromDefault = unwrapGitgraph({ default: inner });
  assertEquals(typeof fromDefault?.createGitgraph, "function");
  const fromNested = unwrapGitgraph({ default: { default: inner } });
  assertEquals(typeof fromNested?.createGitgraph, "function");
  const fromGlobal = unwrapGitgraph({ GitgraphJS: inner });
  assertEquals(typeof fromGlobal?.createGitgraph, "function");
});

Deno.test("unwrapGitgraph returns null when createGitgraph is missing", () => {
  assertEquals(unwrapGitgraph({ templateExtend: () => ({}) }), null);
});
