import type { GraphCommit, Snapshot } from "../git-vm/types.ts";
import { stashHiwFromSnapshot, stashRole } from "./stash_hiw.ts";
import {
  visBareHeadLabel,
  visWorktreeDiamonds,
} from "./policy.ts";

export function prettyRef(name: string): string {
  return name
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/remotes\//, "")
    .replace(/^refs\/tags\//, "")
    .replace(/^refs\/stash$/, "stash");
}

export interface LaidOutCommit {
  kind: "commit";
  id: string;
  parents: string[];
  message: string;
  dangling: boolean;
  /** 0 = newest (top of the SVG). */
  row: number;
  col: number;
  branches: string[];
  isHead: boolean;
  isMerge: boolean;
  stashRole: "H" | "I" | "W" | null;
}

export interface LaidOutExtra {
  kind: "worktree" | "bare";
  id: string;
  label: string;
  target: string | null;
  row: number;
  col: number;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  fromCol: number;
  toCol: number;
  fromRow: number;
  toRow: number;
}

export interface CommitLayout {
  nodes: LaidOutCommit[];
  extras: LaidOutExtra[];
  edges: GraphEdge[];
  colCount: number;
  rowCount: number;
  branchHeads: Record<string, string>;
  currentBranch: string | null;
}

function topoSort(commits: GraphCommit[]): GraphCommit[] {
  const byId = new Map(commits.map((c) => [c.id, c]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const out: GraphCommit[] = [];

  const visit = (id: string) => {
    if (visited.has(id) || visiting.has(id)) return;
    const commit = byId.get(id);
    if (!commit) return;
    visiting.add(id);
    for (const parent of commit.parents) visit(parent);
    visiting.delete(id);
    visited.add(id);
    out.push(commit);
  };

  for (const commit of commits) visit(commit.id);
  return out;
}

function assignColumns(newestFirst: GraphCommit[]): Map<string, number> {
  const lanes: (string | null)[] = [];
  const col = new Map<string, number>();

  for (const commit of newestFirst) {
    let c = lanes.findIndex((id) => id === commit.id);
    if (c === -1) {
      c = lanes.findIndex((id) => id === null);
      if (c === -1) {
        c = lanes.length;
        lanes.push(null);
      }
    }
    col.set(commit.id, c);
    lanes[c] = null;
    const first = commit.parents[0];
    if (first) {
      const existing = lanes.findIndex((id) => id === first);
      if (existing === -1) lanes[c] = first;
    }
    for (const parent of commit.parents.slice(1)) {
      if (lanes.includes(parent)) continue;
      let slot = lanes.findIndex((id) => id === null);
      if (slot === -1) {
        slot = lanes.length;
        lanes.push(parent);
      } else {
        lanes[slot] = parent;
      }
    }
  }

  return col;
}

/** Ancestors of `tipId` including the tip. */
export function ancestorSet(
  commits: readonly { id: string; parents: string[] }[],
  tipId: string | null,
): Set<string> {
  const seen = new Set<string>();
  if (!tipId) return seen;
  const byId = new Map(commits.map((c) => [c.id, c]));
  const queue = [tipId];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (!node) continue;
    for (const parent of node.parents) queue.push(parent);
  }
  return seen;
}

export function layoutCommitGraph(snapshot: Snapshot): CommitLayout {
  const hiw = stashHiwFromSnapshot(snapshot);
  const topo = topoSort(snapshot.commits);
  const newestFirst = [...topo].reverse();
  const columns = assignColumns(newestFirst);
  const rowOf = new Map(newestFirst.map((c, i) => [c.id, i]));

  const branchHeads: Record<string, string> = {};
  for (const ref of snapshot.refs) {
    if (
      ref.kind === "branch" || ref.kind === "remote" || ref.kind === "stash" ||
      ref.kind === "tag"
    ) {
      branchHeads[prettyRef(ref.name)] = ref.target;
    }
  }

  const nodes: LaidOutCommit[] = newestFirst.map((commit) => {
    const branches = snapshot.refs
      .filter((r) =>
        r.target === commit.id &&
        (r.kind === "branch" || r.kind === "remote" || r.kind === "stash" ||
          r.kind === "tag")
      )
      .map((r) => prettyRef(r.name));
    return {
      kind: "commit",
      id: commit.id,
      parents: commit.parents,
      message: commit.message,
      dangling: !!commit.dangling,
      row: rowOf.get(commit.id) ?? 0,
      col: columns.get(commit.id) ?? 0,
      branches,
      isHead: snapshot.head === commit.id,
      isMerge: commit.parents.length > 1,
      stashRole: stashRole(hiw, commit.id),
    };
  });

  const colOf = (id: string) => columns.get(id) ?? 0;
  const edges: GraphEdge[] = [];
  for (const commit of newestFirst) {
    const fromRow = rowOf.get(commit.id) ?? 0;
    const fromCol = colOf(commit.id);
    for (const parent of commit.parents) {
      if (!rowOf.has(parent)) continue;
      edges.push({
        fromId: commit.id,
        toId: parent,
        fromCol,
        toCol: colOf(parent),
        fromRow,
        toRow: rowOf.get(parent) ?? 0,
      });
    }
  }

  let colCount = 0;
  for (const node of nodes) colCount = Math.max(colCount, node.col + 1);
  const rowCount = nodes.length;

  const extras: LaidOutExtra[] = [];
  let extraCol = colCount;
  const showWorktrees = snapshot.worktrees.length > 1 || snapshot.bare;
  const diamonds = showWorktrees ? visWorktreeDiamonds(snapshot) : [];
  for (const wt of diamonds) {
    const target = wt.branch
      ? snapshot.refs.find((r) =>
        r.kind === "branch" && prettyRef(r.name) === wt.branch
      )?.target ?? snapshot.head
      : snapshot.head;
    const row = target != null && rowOf.has(target) ? rowOf.get(target)! : 0;
    extras.push({
      kind: "worktree",
      id: `wt:${wt.id}`,
      label: `worktree ${wt.path}`,
      target,
      row,
      col: extraCol,
    });
    extraCol += 1;
  }
  if (visBareHeadLabel(snapshot)) {
    const target = snapshot.head;
    const row = target != null && rowOf.has(target) ? rowOf.get(target)! : 0;
    extras.push({
      kind: "bare",
      id: "bare",
      label: "bare",
      target,
      row,
      col: extraCol,
    });
    extraCol += 1;
  }
  colCount = Math.max(colCount, extraCol);

  return {
    nodes,
    extras,
    edges,
    colCount: Math.max(1, colCount),
    rowCount,
    branchHeads,
    currentBranch: snapshot.branch,
  };
}
