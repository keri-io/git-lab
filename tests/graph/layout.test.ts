import { assertEquals } from "@std/assert";
import {
  ancestorSet,
  layoutCommitGraph,
  prettyRef,
} from "@/lib/graph/layout.ts";
import { needsVisOverlay } from "@/lib/graph/policy.ts";
import type { Snapshot } from "@/lib/git-vm/types.ts";

const emptySnap: Snapshot = {
  commits: [],
  refs: [],
  head: null,
  branch: "main",
  index: [],
  files: {},
  conflicted: false,
  bare: false,
  worktrees: [{ id: "main", path: ".", branch: "main" }],
  threeTrees: { worktree: [], index: [], head: [] },
};

const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
const M = "d".repeat(40);

Deno.test("prettyRef strips refs/heads and names stash", () => {
  assertEquals(prettyRef("refs/heads/main"), "main");
  assertEquals(prettyRef("refs/remotes/origin/main"), "origin/main");
  assertEquals(prettyRef("refs/stash"), "stash");
  assertEquals(prettyRef("refs/tags/v1.0"), "v1.0");
});

Deno.test("empty snapshot yields no nodes", () => {
  const layout = layoutCommitGraph(emptySnap);
  assertEquals(layout.nodes.length, 0);
  assertEquals(layout.edges.length, 0);
  assertEquals(layout.rowCount, 0);
});

Deno.test("linear history is a single lane; newest is row 0", () => {
  const snap: Snapshot = {
    ...emptySnap,
    head: C,
    branch: "main",
    commits: [
      { id: A, parents: [], message: "one" },
      { id: B, parents: [A], message: "two" },
      { id: C, parents: [B], message: "three" },
    ],
    refs: [{ name: "refs/heads/main", target: C, kind: "branch" }],
  };
  const layout = layoutCommitGraph(snap);
  assertEquals(layout.nodes.map((n) => n.id), [C, B, A]);
  assertEquals(layout.nodes.map((n) => n.col), [0, 0, 0]);
  assertEquals(layout.nodes.map((n) => n.row), [0, 1, 2]);
  assertEquals(layout.nodes[0]?.isHead, true);
  assertEquals(layout.nodes[0]?.branches, ["main"]);
  assertEquals(layout.colCount, 1);
  assertEquals(layout.edges.length, 2);
});

Deno.test("merge commit spans two parent lanes", () => {
  const snap: Snapshot = {
    ...emptySnap,
    head: M,
    branch: "main",
    commits: [
      { id: A, parents: [], message: "root" },
      { id: B, parents: [A], message: "main" },
      { id: C, parents: [A], message: "topic" },
      { id: M, parents: [B, C], message: "merge" },
    ],
    refs: [{ name: "refs/heads/main", target: M, kind: "branch" }],
  };
  const layout = layoutCommitGraph(snap);
  const merge = layout.nodes.find((n) => n.id === M);
  assertEquals(merge?.isMerge, true);
  const cols = new Set(layout.nodes.map((n) => n.col));
  assertEquals(cols.size >= 2, true);
  assertEquals(layout.edges.filter((e) => e.fromId === M).length, 2);
});

Deno.test("ancestorSet includes tip and walks first and second parents", () => {
  const commits = [
    { id: A, parents: [] },
    { id: B, parents: [A] },
    { id: C, parents: [A] },
    { id: M, parents: [B, C] },
  ];
  const seen = ancestorSet(commits, M);
  assertEquals([...seen].sort(), [A, B, C, M].sort());
  assertEquals(ancestorSet(commits, null).size, 0);
});

Deno.test("two worktrees add extra diamonds; bare with no checkout adds a bare node", () => {
  const withWt: Snapshot = {
    ...emptySnap,
    head: A,
    commits: [{ id: A, parents: [], message: "root" }],
    refs: [{ name: "refs/heads/main", target: A, kind: "branch" }],
    worktrees: [
      { id: "main", path: ".", branch: "main" },
      { id: "hotfix", path: "../hotfix", branch: "hotfix" },
    ],
  };
  const layoutWt = layoutCommitGraph(withWt);
  assertEquals(layoutWt.extras.map((e) => e.kind), ["worktree", "worktree"]);
  assertEquals(needsVisOverlay(withWt), true);

  const bare: Snapshot = {
    ...emptySnap,
    bare: true,
    worktrees: [],
    head: A,
    commits: [{ id: A, parents: [], message: "root" }],
  };
  const layoutBare = layoutCommitGraph(bare);
  assertEquals(layoutBare.extras.map((e) => e.kind), ["bare"]);
});
