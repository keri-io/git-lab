/** Unwrap @gitgraph/js whether Vite handed us ESM named exports or a UMD default. */

export type GitBranch = {
  name: string;
  commit: (
    opts: {
      subject: string;
      hash: string;
      style?: Record<string, unknown>;
    },
  ) => GitBranch;
  merge: (
    opts: {
      branch: GitBranch;
      commitOptions?: {
        subject: string;
        hash: string;
        style?: Record<string, unknown>;
      };
    },
  ) => GitBranch;
};

export type GitgraphApi = {
  branch: (opts: string | { name: string; from?: string }) => GitBranch;
  tag: (opts: { name: string; ref?: string }) => unknown;
  import: (data: unknown) => unknown;
  clear: () => unknown;
};

export type GitgraphModule = {
  createGitgraph: (
    container: HTMLElement,
    options?: Record<string, unknown>,
  ) => GitgraphApi;
  templateExtend: (name: unknown, options: Record<string, unknown>) => unknown;
  TemplateName: { Metro: unknown };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function pickCreate(
  rec: Record<string, unknown>,
): GitgraphModule["createGitgraph"] | null {
  const fn = rec.createGitgraph;
  return typeof fn === "function"
    ? fn as GitgraphModule["createGitgraph"]
    : null;
}

/**
 * Pull createGitgraph / templateExtend / TemplateName off named exports,
 * default, nested default, or the UMD `GitgraphJS` global bag.
 */
export function unwrapGitgraph(raw: unknown): GitgraphModule | null {
  const seen = new Set<unknown>();
  const queue: unknown[] = [raw];
  let create: GitgraphModule["createGitgraph"] | null = null;
  let templateExtend: GitgraphModule["templateExtend"] | undefined;
  let TemplateName: GitgraphModule["TemplateName"] | undefined;

  while (queue.length) {
    const cand = queue.shift();
    if (!cand || typeof cand !== "object" || seen.has(cand)) continue;
    seen.add(cand);
    const rec = asRecord(cand);
    if (!rec) continue;

    if (!create) create = pickCreate(rec);
    if (!templateExtend && typeof rec.templateExtend === "function") {
      templateExtend = rec.templateExtend as GitgraphModule["templateExtend"];
    }
    const names = rec.TemplateName;
    if (!TemplateName && names && typeof names === "object") {
      TemplateName = names as GitgraphModule["TemplateName"];
    }

    for (const key of ["default", "GitgraphJS", "gitgraph"]) {
      if (key in rec) queue.push(rec[key]);
    }
  }

  if (!create) return null;
  return {
    createGitgraph: create,
    templateExtend: templateExtend ?? ((_name, options) => options),
    TemplateName: TemplateName ?? { Metro: "metro" },
  };
}

/**
 * Vite resolves `@gitgraph/js` to the UMD `browser` field. Prefer the ESM
 * entry so createGitgraph actually runs; UMD is the fallback unwrap path.
 */
export async function loadGitgraph(): Promise<GitgraphModule> {
  try {
    const raw = await import("@gitgraph/js/lib/index.js");
    const mod = unwrapGitgraph(raw);
    if (mod) return mod;
    console.warn("gitgraph: ESM entry had no createGitgraph");
  } catch (err) {
    console.warn("gitgraph: ESM entry failed", err);
  }

  try {
    const raw = await import("@gitgraph/js/lib/gitgraph.umd.js");
    const mod = unwrapGitgraph(raw);
    if (mod) return mod;
    console.warn("gitgraph: UMD had no createGitgraph");
  } catch (err) {
    console.warn("gitgraph: UMD import failed", err);
  }

  try {
    const raw = await import("@gitgraph/js");
    const mod = unwrapGitgraph(raw);
    if (mod) return mod;
    console.warn("gitgraph: package root had no createGitgraph");
  } catch (err) {
    console.warn("gitgraph: package root import failed", err);
  }

  throw new Error("gitgraph unavailable: createGitgraph not found");
}
