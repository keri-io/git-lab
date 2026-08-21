import type { Snapshot } from "../git-vm/types.ts";
import { prefersReducedMotion } from "../overlays/motion.ts";
import {
  ancestorSet,
  type CommitLayout,
  type LaidOutCommit,
  layoutCommitGraph,
} from "./layout.ts";

export interface GraphViewOptions {
  reduceMotion?: boolean;
  highlightRef?: string | null;
  selectedId?: string | null;
}

export interface GraphUiState {
  selectedId: string | null;
  highlightRef: string | null;
  zoom: number;
}

export interface GraphTheme {
  text: string;
  muted: string;
  surface: string;
  border: string;
  accent: string;
  stash: string;
  success: string;
  canvas: string;
  term: string;
}

const ROW_H = 56;
const COL_W = 48;
const NODE_R = 12;
const PAD_X = 28;
const PAD_Y = 28;
const LABEL_GAP = 20;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.75;
const ZOOM_STEP = 1.2;
const SVG_NS = "http://www.w3.org/2000/svg";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const BARE_LABEL = "#cdd6f4";

const uiByContainer = new WeakMap<HTMLElement, GraphUiState>();
const seenIdsByContainer = new WeakMap<HTMLElement, Set<string>>();

export function graphUiState(container: HTMLElement): GraphUiState {
  let ui = uiByContainer.get(container);
  if (!ui) {
    ui = { selectedId: null, highlightRef: null, zoom: 1 };
    uiByContainer.set(container, ui);
  }
  return ui;
}

export function readGraphTheme(el: HTMLElement): GraphTheme {
  const root = el.ownerDocument?.documentElement ?? el;
  const sEl = getComputedStyle(el);
  const sRoot = root === el ? sEl : getComputedStyle(root);
  const v = (name: string, fb: string) =>
    sEl.getPropertyValue(name).trim() ||
    sRoot.getPropertyValue(name).trim() ||
    fb;
  return {
    text: v("--lg-text", "#4c4f69"),
    muted: v("--lg-muted", "#6c6f85"),
    surface: v("--lg-surface", "#e6e9ef"),
    border: v("--lg-border", "#ccd0da"),
    accent: v("--lg-accent", "#1e66f5"),
    stash: v("--lg-stash", "#8839ef"),
    success: v("--lg-success", "#40a02b"),
    canvas: v("--lg-graph-canvas", "#eff1f5"),
    term: v("--lg-term-bg", "#1e1e2e"),
  };
}

export function shortHash(id: string): string {
  return id.length > 8 ? id.slice(0, 7) : id;
}

function firstLine(message: string): string {
  const nl = message.indexOf("\n");
  return nl === -1 ? message : message.slice(0, nl);
}

function nodeLabel(node: LaidOutCommit): string {
  const role = node.stashRole ? `[${node.stashRole}] ` : "";
  return `${role}${shortHash(node.id)}  ${firstLine(node.message)}`;
}

function reduceMotionOn(options?: GraphViewOptions): boolean {
  return !!options?.reduceMotion || prefersReducedMotion();
}

function colX(col: number): number {
  return PAD_X + col * COL_W;
}

function rowY(row: number): number {
  return PAD_Y + row * ROW_H;
}

function svgEl(
  tag: string,
  attrs: Record<string, string> = {},
): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function edgePath(
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
): string {
  const x1 = colX(fromCol);
  const y1 = rowY(fromRow);
  const x2 = colX(toCol);
  const y2 = rowY(toRow);
  if (fromCol === toCol) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

function pruneUi(ui: GraphUiState, layout: CommitLayout): void {
  if (ui.selectedId && !layout.nodes.some((n) => n.id === ui.selectedId)) {
    ui.selectedId = null;
  }
  if (ui.highlightRef && layout.branchHeads[ui.highlightRef] == null) {
    ui.highlightRef = null;
  }
  if (!Number.isFinite(ui.zoom) || ui.zoom <= 0) ui.zoom = 1;
  ui.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ui.zoom));
}

function highlightedIds(
  layout: CommitLayout,
  ref: string | null,
): Set<string> | null {
  if (!ref) return null;
  const tip = layout.branchHeads[ref];
  if (!tip) return null;
  return ancestorSet(layout.nodes, tip);
}

function fillFor(node: LaidOutCommit, colors: GraphTheme): string {
  if (node.dangling) return colors.muted;
  if (node.stashRole) return colors.stash;
  return colors.accent;
}

function estimateLabelWidth(node: LaidOutCommit): number {
  const text = nodeLabel(node);
  const badges = node.branches.length + (node.isHead ? 1 : 0);
  return text.length * 7.4 + badges * 52 + 16;
}

function playEnterMotion(
  edges: SVGPathElement[],
  scales: SVGElement[],
): void {
  for (const path of edges) {
    try {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      const anim = path.animate(
        [{ strokeDashoffset: String(len) }, { strokeDashoffset: "0" }],
        { duration: 480, easing: "ease-out", fill: "forwards" },
      );
      anim.addEventListener("finish", () => {
        path.style.strokeDasharray = "";
        path.style.strokeDashoffset = "";
      });
    } catch {
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
    }
  }
  for (const inner of scales) {
    inner.style.transformOrigin = "0px 0px";
    inner.animate(
      [{ transform: "scale(0)" }, { transform: "scale(1)" }],
      {
        duration: 380,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
  }
}

export function renderInteractiveSvg(
  container: HTMLElement,
  snapshot: Snapshot,
  options?: GraphViewOptions,
): void {
  const colors = readGraphTheme(container);
  const layout = layoutCommitGraph(snapshot);
  const ui = graphUiState(container);
  pruneUi(ui, layout);
  if (options && "highlightRef" in options) {
    ui.highlightRef = options.highlightRef ?? null;
    pruneUi(ui, layout);
  }
  if (options && "selectedId" in options && options.selectedId) {
    ui.selectedId = options.selectedId;
    pruneUi(ui, layout);
  }

  const reduce = reduceMotionOn(options);
  const prevIds = seenIdsByContainer.get(container);
  const newIds = new Set<string>();
  for (const node of layout.nodes) {
    if (prevIds && !prevIds.has(node.id)) newIds.add(node.id);
  }

  const labelColX = PAD_X + layout.colCount * COL_W + LABEL_GAP;
  let maxLabel = 180;
  for (const node of layout.nodes) {
    maxLabel = Math.max(maxLabel, estimateLabelWidth(node));
  }
  const contentW = Math.max(labelColX + maxLabel + PAD_X, 320);
  const contentH = Math.max(
    PAD_Y * 2 + Math.max(layout.rowCount, 1) * ROW_H,
    96,
  );

  const root = document.createElement("div");
  root.className = "lg-graph";
  if (reduce) root.classList.add("lg-graph--reduce-motion");

  const toolbar = document.createElement("div");
  toolbar.className = "lg-graph-toolbar";

  const chips = document.createElement("div");
  chips.className = "lg-graph-chips";
  const chipNames = Object.keys(layout.branchHeads).sort((a, b) => {
    if (a === layout.currentBranch) return -1;
    if (b === layout.currentBranch) return 1;
    return a.localeCompare(b);
  });
  for (const name of chipNames) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lg-graph-chip";
    btn.dataset.ref = name;
    btn.textContent = name;
    if (name === layout.currentBranch) {
      btn.classList.add("lg-graph-chip--current");
    }
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ui.highlightRef = ui.highlightRef === name ? null : name;
      sync();
    });
    chips.appendChild(btn);
  }
  toolbar.appendChild(chips);

  const stage = document.createElement("div");
  stage.className = "lg-graph-stage";
  const inspectSlot = document.createElement("div");
  inspectSlot.className = "lg-graph-inspect-slot";
  const viewport = document.createElement("div");
  viewport.className = "lg-graph-viewport";

  const zoomBar = document.createElement("div");
  zoomBar.className = "lg-graph-zoom";
  const mkZoom = (title: string, label: string, onClick: () => void) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = title;
    btn.textContent = label;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick();
    });
    zoomBar.appendChild(btn);
    return btn;
  };
  mkZoom("Zoom In", "+", () => {
    ui.zoom = Math.min(ZOOM_MAX, ui.zoom * ZOOM_STEP);
    applyZoom();
  });
  mkZoom("Zoom Out", "−", () => {
    ui.zoom = Math.max(ZOOM_MIN, ui.zoom / ZOOM_STEP);
    applyZoom();
  });
  mkZoom("Fit", "Fit", () => {
    const availW = Math.max(container.clientWidth, 1);
    const availH = Math.max(
      container.clientHeight - toolbar.offsetHeight,
      1,
    );
    const z = Math.min(availW / contentW, availH / contentH);
    ui.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    applyZoom();
  });
  toolbar.appendChild(zoomBar);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${contentW} ${contentH}`,
    role: "img",
  }) as SVGSVGElement;
  svg.setAttribute("aria-hidden", "true");
  svg.dataset.graphKind = "interactive";
  svg.classList.add("lg-graph-svg");

  const bg = svgEl("rect", {
    class: "lg-graph-bg",
    x: "0",
    y: "0",
    width: String(contentW),
    height: String(contentH),
    fill: colors.canvas,
  });
  svg.appendChild(bg);

  const edgesG = svgEl("g", { class: "lg-graph-edges" });
  const extrasG = svgEl("g", { class: "lg-graph-extras" });
  const nodesG = svgEl("g", { class: "lg-graph-nodes" });
  svg.append(edgesG, extrasG, nodesG);

  const newEdgePaths: SVGPathElement[] = [];
  for (const edge of layout.edges) {
    const d = edgePath(edge.fromCol, edge.fromRow, edge.toCol, edge.toRow);
    const path = svgEl("path", {
      d,
      fill: "none",
      stroke: colors.muted,
      "stroke-width": "2",
      "data-edge-from": edge.fromId,
      "data-edge-to": edge.toId,
    }) as SVGPathElement;
    edgesG.appendChild(path);
    if (!reduce && newIds.has(edge.fromId)) newEdgePaths.push(path);
  }

  for (const extra of layout.extras) {
    const x = colX(extra.col);
    const y = rowY(extra.row);
    const g = svgEl("g", {
      class: "lg-graph-extra",
      transform: `translate(${x} ${y})`,
      "data-extra-id": extra.id,
    });
    if (extra.target) {
      const target = layout.nodes.find((n) => n.id === extra.target);
      if (target) {
        const dash = svgEl("path", {
          d: edgePath(extra.col, extra.row, target.col, target.row),
          fill: "none",
          stroke: extra.kind === "worktree" ? colors.success : colors.muted,
          "stroke-width": "1.5",
          "stroke-dasharray": "4 3",
          "data-edge-from": extra.id,
          "data-edge-to": extra.target,
        });
        edgesG.appendChild(dash);
      }
    }
    if (extra.kind === "worktree") {
      const r = 10;
      g.appendChild(svgEl("polygon", {
        points: `0,${-r} ${r},0 0,${r} ${-r},0`,
        fill: colors.success,
        stroke: colors.success,
      }));
      const t = svgEl("text", {
        x: "0",
        y: "22",
        fill: colors.text,
        "font-size": "10",
        "font-family": MONO,
        "text-anchor": "middle",
      });
      t.textContent = extra.label;
      g.appendChild(t);
    } else {
      g.appendChild(svgEl("ellipse", {
        rx: "16",
        ry: "11",
        fill: colors.term,
        stroke: colors.muted,
      }));
      const t = svgEl("text", {
        x: "0",
        y: "4",
        fill: BARE_LABEL,
        "font-size": "11",
        "font-family": MONO,
        "text-anchor": "middle",
      });
      t.textContent = extra.label;
      g.appendChild(t);
    }
    extrasG.appendChild(g);
  }

  const newScales: SVGElement[] = [];
  for (const node of layout.nodes) {
    const x = colX(node.col);
    const y = rowY(node.row);
    const g = svgEl("g", {
      class: "lg-graph-commit",
      transform: `translate(${x} ${y})`,
      tabindex: "0",
      focusable: "true",
      "data-commit-id": node.id,
    });
    if (node.dangling) g.classList.add("lg-graph-commit--dangling");
    if (node.isHead) g.classList.add("lg-graph-commit--head");

    const scale = svgEl("g", { class: "lg-graph-commit-scale" });
    if (node.isHead) {
      scale.appendChild(svgEl("circle", {
        class: "lg-graph-head-halo",
        r: "18",
        fill: "none",
        stroke: colors.accent,
        "stroke-width": "2",
      }));
    }
    if (node.isMerge) {
      scale.appendChild(svgEl("circle", {
        r: "16",
        fill: "none",
        stroke: colors.border,
        "stroke-width": "1.5",
      }));
    }
    const opacity = node.dangling ? "0.55" : "1";
    scale.appendChild(svgEl("circle", {
      class: "lg-graph-dot",
      r: String(NODE_R),
      fill: fillFor(node, colors),
      opacity,
    }));

    const label = svgEl("text", {
      class: "lg-graph-label",
      x: String(labelColX - x),
      y: "4",
      fill: node.dangling ? colors.muted : colors.text,
      opacity,
      "font-size": "13",
      "font-family": MONO,
    });
    label.textContent = nodeLabel(node);
    scale.appendChild(label);

    let badgeX = labelColX - x + nodeLabel(node).length * 7.4 + 10;
    const addBadge = (
      text: string,
      refName: string | null,
      fill: string,
      stroke: string,
      fg: string,
    ) => {
      const bgW = text.length * 6.6 + 12;
      const badge = svgEl("g", { class: "lg-graph-badge" });
      if (refName) badge.setAttribute("data-ref", refName);
      badge.appendChild(svgEl("rect", {
        x: String(badgeX),
        y: "-9",
        width: String(bgW),
        height: "18",
        rx: "9",
        fill,
        stroke,
      }));
      const t = svgEl("text", {
        x: String(badgeX + bgW / 2),
        y: "4",
        fill: fg,
        "font-size": "10",
        "font-family": MONO,
        "text-anchor": "middle",
      });
      t.textContent = text;
      badge.appendChild(t);
      if (refName) {
        badge.style.cursor = "pointer";
        badge.addEventListener("click", (ev) => {
          ev.stopPropagation();
          ui.highlightRef = ui.highlightRef === refName ? null : refName;
          sync();
        });
      }
      scale.appendChild(badge);
      badgeX += bgW + 6;
    };

    if (node.isHead) {
      addBadge("HEAD", null, colors.accent, colors.accent, colors.canvas);
    }
    for (const branch of node.branches) {
      addBadge(branch, branch, colors.surface, colors.border, colors.text);
    }

    g.appendChild(scale);
    g.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ui.selectedId = node.id;
      sync();
    });
    g.addEventListener("keydown", (ev) => {
      const ke = ev as KeyboardEvent;
      if (ke.key !== "Enter" && ke.key !== " ") return;
      ke.preventDefault();
      ui.selectedId = node.id;
      sync();
    });
    nodesG.appendChild(g);
    if (!reduce && newIds.has(node.id)) newScales.push(scale);
  }

  const clearIfBackground = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    if (
      target === bg ||
      target === svg ||
      target === viewport ||
      target === stage ||
      target.classList.contains("lg-graph-bg")
    ) {
      if (ui.selectedId) {
        ui.selectedId = null;
        sync();
      }
    }
  };
  svg.addEventListener("click", (ev) => clearIfBackground(ev.target));
  viewport.addEventListener("click", (ev) => clearIfBackground(ev.target));
  stage.addEventListener("click", (ev) => clearIfBackground(ev.target));

  viewport.appendChild(svg);
  stage.append(inspectSlot, viewport);
  root.append(toolbar, stage);
  container.replaceChildren(root);
  container.dataset.graphKind = "interactive";

  function applyZoom() {
    svg.style.width = `${contentW * ui.zoom}px`;
    svg.style.height = `${contentH * ui.zoom}px`;
  }

  function sync() {
    const keep = highlightedIds(layout, ui.highlightRef);
    for (const el of root.querySelectorAll(".lg-graph-chip[data-ref]")) {
      const name = (el as HTMLElement).dataset.ref;
      el.classList.toggle(
        "lg-graph-chip--on",
        !!name && name === ui.highlightRef,
      );
    }
    for (const badge of svg.querySelectorAll(".lg-graph-badge[data-ref]")) {
      const name = badge.getAttribute("data-ref");
      const on = !!name && name === ui.highlightRef;
      const rect = badge.querySelector("rect");
      const text = badge.querySelector("text");
      rect?.setAttribute("fill", on ? colors.accent : colors.surface);
      rect?.setAttribute("stroke", on ? colors.accent : colors.border);
      text?.setAttribute("fill", on ? colors.canvas : colors.text);
    }
    for (const g of nodesG.querySelectorAll("[data-commit-id]")) {
      const id = g.getAttribute("data-commit-id") ?? "";
      g.classList.toggle("lg-graph-commit--selected", id === ui.selectedId);
      g.classList.toggle("lg-graph-dim", keep != null && !keep.has(id));
    }
    for (const extra of extrasG.querySelectorAll("[data-extra-id]")) {
      const extraId = extra.getAttribute("data-extra-id");
      const laid = layout.extras.find((e) => e.id === extraId);
      extra.classList.toggle(
        "lg-graph-dim",
        keep != null && (!laid?.target || !keep.has(laid.target)),
      );
    }
    for (const path of edgesG.querySelectorAll("[data-edge-from]")) {
      const from = path.getAttribute("data-edge-from") ?? "";
      const to = path.getAttribute("data-edge-to") ?? "";
      const fromOk = keep == null || keep.has(from) ||
        layout.extras.some((e) =>
          e.id === from && e.target != null && keep.has(e.target)
        );
      const toOk = keep == null || keep.has(to);
      path.classList.toggle("lg-graph-dim", !(fromOk && toOk));
    }
    paintInspect(inspectSlot, layout, ui, colors, () => {
      ui.selectedId = null;
      sync();
    }, (ref) => {
      ui.highlightRef = ui.highlightRef === ref ? null : ref;
      sync();
    });
  }

  applyZoom();
  sync();
  playEnterMotion(newEdgePaths, newScales);
  seenIdsByContainer.set(
    container,
    new Set(layout.nodes.map((n) => n.id)),
  );
}

function paintInspect(
  slot: HTMLElement,
  layout: CommitLayout,
  ui: GraphUiState,
  colors: GraphTheme,
  onClose: () => void,
  onBadge: (ref: string) => void,
): void {
  const node = ui.selectedId
    ? layout.nodes.find((n) => n.id === ui.selectedId) ?? null
    : null;
  slot.replaceChildren();
  if (!node) return;

  const card = document.createElement("aside");
  card.className = "lg-graph-inspect";
  card.setAttribute("aria-label", "Commit details");

  const head = document.createElement("div");
  head.className = "lg-graph-inspect-head";
  const title = document.createElement("strong");
  title.textContent = "Commit";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onClose();
  });
  head.append(title, close);

  const hash = document.createElement("p");
  hash.className = "lg-graph-inspect-id";
  hash.translate = false;
  hash.textContent = node.id;

  const msg = document.createElement("p");
  msg.className = "lg-graph-inspect-msg";
  msg.textContent = node.message;

  const parents = document.createElement("p");
  parents.className = "lg-graph-inspect-parents";
  parents.textContent = node.parents.length
    ? `Parents: ${node.parents.map(shortHash).join(", ")}`
    : "Parents: none";

  const branches = document.createElement("div");
  branches.className = "lg-graph-inspect-branches";
  if (node.branches.length === 0) {
    const empty = document.createElement("span");
    empty.className = "lg-graph-inspect-muted";
    empty.textContent = "No branch refs";
    branches.appendChild(empty);
  } else {
    for (const name of node.branches) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lg-graph-chip";
      btn.dataset.ref = name;
      btn.textContent = name;
      if (name === ui.highlightRef) btn.classList.add("lg-graph-chip--on");
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onBadge(name);
      });
      branches.appendChild(btn);
    }
  }

  const flags = document.createElement("ul");
  flags.className = "lg-graph-inspect-flags";
  const addFlag = (label: string) => {
    const li = document.createElement("li");
    li.textContent = label;
    flags.appendChild(li);
  };
  if (node.isHead) addFlag("HEAD");
  if (node.isMerge) addFlag("merge");
  if (node.dangling) addFlag("dangling");
  if (node.stashRole) addFlag(`[${node.stashRole}]`);

  card.append(head, hash, msg, parents, branches);
  if (flags.childElementCount > 0) card.appendChild(flags);
  card.style.borderColor = colors.border;
  card.style.background = colors.surface;
  card.addEventListener("click", (ev) => ev.stopPropagation());
  slot.appendChild(card);
}

export function paintVisInspect(
  slot: HTMLElement,
  snapshot: Snapshot,
  container: HTMLElement,
  onChange: () => void,
): void {
  const ui = graphUiState(container);
  const layout = layoutCommitGraph(snapshot);
  pruneUi(ui, layout);
  paintInspect(slot, layout, ui, readGraphTheme(container), () => {
    ui.selectedId = null;
    onChange();
  }, (ref) => {
    ui.highlightRef = ui.highlightRef === ref ? null : ref;
    onChange();
  });
}
