import type { Snapshot } from "../git-vm/types.ts";
import {
  graphUiState,
  type GraphViewOptions,
  paintVisInspect,
  readGraphTheme,
  renderInteractiveSvg,
  shortHash,
} from "./interactive_svg.ts";
import { prettyRef } from "./layout.ts";
import {
  needsVisOverlay,
  visBareHeadLabel,
  visWorktreeDiamonds,
} from "./policy.ts";
import { stashHiwFromSnapshot, stashRole } from "./stash_hiw.ts";
import { topoSortCommits } from "./topo.ts";

export type { GraphViewOptions } from "./interactive_svg.ts";
export { needsVisOverlay, visBareHeadLabel, visWorktreeDiamonds };

type Network = {
  destroy: () => void;
  on: (event: string, handler: (params: unknown) => void) => void;
};

type DataSetCtor = new (data: unknown[]) => unknown;

type VisStandalone = {
  DataSet: DataSetCtor;
  Network: new (
    container: HTMLElement,
    data: unknown,
    options: unknown,
  ) => Network;
};

const visByContainer = new WeakMap<HTMLElement, Network>();

/** Light label on success-green worktree diamonds (Latte base). */
const WT_LABEL = "#eff1f5";
/** Mocha text — readable on dark `--lg-term-bg` / crust fill. */
const BARE_LABEL = "#cdd6f4";

function renderEmpty(container: HTMLElement): void {
  const empty = document.createElement("p");
  empty.className = "text-sm p-4";
  empty.style.color = readGraphTheme(container).muted;
  empty.textContent = "No commits yet.";
  container.appendChild(empty);
}

function renderWithVis(
  container: HTMLElement,
  snapshot: Snapshot,
  vis: VisStandalone,
): Network {
  type NodeItem = {
    id: string;
    label: string;
    color?: string | { background: string; border: string };
    font?: { color: string; size?: number };
    shape?: string;
    title?: string;
  };
  type EdgeItem = {
    id: string;
    from: string;
    to: string;
    dashes?: boolean;
    color?: string;
    arrows?: string;
  };

  const colors = readGraphTheme(container);
  const hiw = stashHiwFromSnapshot(snapshot);
  const ui = graphUiState(container);

  const root = document.createElement("div");
  root.className = "lg-graph";
  const host = document.createElement("div");
  host.className = "lg-graph-vis-host";
  const slot = document.createElement("div");
  slot.className = "lg-graph-inspect-slot";
  root.append(host, slot);
  container.appendChild(root);

  const nodes: NodeItem[] = snapshot.commits.map((commit) => {
    const labels = snapshot.refs
      .filter((r) => r.target === commit.id)
      .map((r) => prettyRef(r.name));
    const isStash = snapshot.refs.some((r) =>
      r.kind === "stash" && r.target === commit.id
    );
    const role = stashRole(hiw, commit.id);
    const color = commit.dangling
      ? colors.muted
      : isStash
      ? colors.stash
      : colors.accent;
    const roleTag = role ? `[${role}] ` : "";
    const tag = labels.length ? `\n${labels.join(" · ")}` : "";
    return {
      id: commit.id,
      label: `${roleTag}${shortHash(commit.id)}  ${commit.message}${tag}`,
      color,
      font: { color: commit.dangling ? colors.muted : colors.text },
      shape: "box",
      title: commit.id,
    };
  });

  const edges: EdgeItem[] = [];
  for (const commit of snapshot.commits) {
    for (const parent of commit.parents) {
      edges.push({
        id: `${parent}->${commit.id}`,
        from: parent,
        to: commit.id,
        arrows: "to",
        color: colors.muted,
      });
    }
  }

  for (const wt of visWorktreeDiamonds(snapshot)) {
    const id = `wt:${wt.id}`;
    const branchName = wt.branch;
    const target = branchName
      ? snapshot.refs.find((r) =>
        r.kind === "branch" && prettyRef(r.name) === branchName
      )?.target ?? snapshot.head
      : snapshot.head;
    nodes.push({
      id,
      label: `worktree ${wt.path}`,
      color: { background: colors.success, border: colors.success },
      font: { color: WT_LABEL },
      shape: "diamond",
    });
    if (target) {
      edges.push({
        id: `${id}->${target}`,
        from: id,
        to: target,
        dashes: true,
        color: colors.success,
        arrows: "to",
      });
    }
  }

  if (visBareHeadLabel(snapshot)) {
    const id = "bare";
    nodes.push({
      id,
      label: "bare",
      color: { background: colors.term, border: colors.muted },
      font: { color: BARE_LABEL, size: 11 },
      shape: "ellipse",
      title: "bare repository",
    });
    if (snapshot.head) {
      edges.push({
        id: `${id}->${snapshot.head}`,
        from: id,
        to: snapshot.head,
        dashes: true,
        color: colors.muted,
        arrows: "to",
      });
    }
  }

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };
  const network = new vis.Network(host, data, {
    autoResize: true,
    interaction: { hover: true, zoomView: true, dragView: true },
    physics: false,
    layout: {
      hierarchical: {
        enabled: true,
        direction: "DU",
        sortMethod: "directed",
        nodeSpacing: 140,
        levelSeparation: 90,
        blockShifting: true,
        edgeMinimization: true,
      },
    },
    nodes: {
      borderWidth: 1,
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    edges: {
      smooth: {
        enabled: true,
        type: "cubicBezier",
        forceDirection: "vertical",
        roundness: 0.4,
      },
    },
  });
  const refreshInspect = () =>
    paintVisInspect(slot, snapshot, container, refreshInspect);
  network.on("click", (params: unknown) => {
    const rec = params && typeof params === "object"
      ? params as { nodes?: unknown[] }
      : null;
    const id = rec?.nodes?.[0];
    ui.selectedId = typeof id === "string" &&
        snapshot.commits.some((c) => c.id === id)
      ? id
      : null;
    refreshInspect();
  });
  refreshInspect();
  container.dataset.graphKind = "vis";
  const canvas = host.querySelector("canvas");
  canvas?.setAttribute("aria-hidden", "true");
  return network;
}

function pickVis(mod: unknown): VisStandalone {
  const rec = mod as Record<string, unknown>;
  const candidates = [rec, rec.default as Record<string, unknown> | undefined];
  for (const cand of candidates) {
    if (
      cand && typeof cand.Network === "function" &&
      typeof cand.DataSet === "function"
    ) {
      return cand as unknown as VisStandalone;
    }
  }
  throw new Error("vis-network unavailable");
}

function renderSimpleSvg(container: HTMLElement, snapshot: Snapshot): void {
  const colors = readGraphTheme(container);
  const ordered = topoSortCommits(snapshot.commits);
  const newestFirst = [...ordered].reverse();
  const rowH = 56;
  const left = 36;
  const width = Math.max(container.clientWidth || 480, 320);
  const height = Math.max(newestFirst.length * rowH + 24, 80);
  const yOf = new Map(newestFirst.map((c, i) => [c.id, 28 + i * rowH]));

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-hidden", "true");
  svg.dataset.graphKind = "svg";

  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
    return el;
  };

  for (const commit of newestFirst) {
    const y = yOf.get(commit.id) ?? 0;
    for (const parent of commit.parents) {
      const py = yOf.get(parent);
      if (py == null) continue;
      add("line", {
        x1: String(left),
        y1: String(y),
        x2: String(left),
        y2: String(py),
        stroke: colors.muted,
        "stroke-width": "2",
      });
    }
  }

  for (const commit of newestFirst) {
    const y = yOf.get(commit.id) ?? 0;
    const labels = snapshot.refs
      .filter((r) => r.target === commit.id)
      .map((r) => prettyRef(r.name));
    add("circle", {
      cx: String(left),
      cy: String(y),
      r: "8",
      fill: commit.dangling ? colors.muted : colors.accent,
      opacity: commit.dangling ? "0.45" : "1",
    });
    const text = add("text", {
      x: String(left + 20),
      y: String(y + 4),
      fill: commit.dangling ? colors.muted : colors.text,
      "font-size": "13",
      "font-family":
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    });
    const tag = labels.length ? `  (${labels.join(", ")})` : "";
    text.textContent = `${shortHash(commit.id)}  ${
      commit.message.split("\n")[0]
    }${tag}`;
  }

  container.replaceChildren(svg);
}

async function loadVis(): Promise<VisStandalone> {
  const mod = await import("vis-network/standalone");
  return pickVis(mod);
}

/**
 * Draw Snapshot.commits + Snapshot.refs with the interactive SVG graph.
 * vis-network is the fallback if SVG construction throws; a plain SVG is the
 * last resort so the pane is never blank.
 */
export async function renderGitGraph(
  container: HTMLElement,
  snapshot: Snapshot,
  isStale?: () => boolean,
  options?: GraphViewOptions,
): Promise<void> {
  if (isStale?.()) return;

  const finish = (draw: () => void) => {
    if (isStale?.()) return;
    const prev = visByContainer.get(container);
    prev?.destroy();
    visByContainer.delete(container);
    container.replaceChildren();
    delete container.dataset.graphKind;
    draw();
  };

  if (snapshot.commits.length === 0) {
    finish(() => renderEmpty(container));
    return;
  }

  try {
    finish(() => renderInteractiveSvg(container, snapshot, options));
    return;
  } catch (err) {
    console.warn("interactive SVG failed; trying vis-network", err);
  }

  try {
    const vis = await loadVis();
    finish(() => {
      visByContainer.set(container, renderWithVis(container, snapshot, vis));
    });
  } catch (visErr) {
    console.warn("vis-network failed; falling back to SVG", visErr);
    finish(() => renderSimpleSvg(container, snapshot));
  }
}
