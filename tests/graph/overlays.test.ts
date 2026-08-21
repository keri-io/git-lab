import { assertEquals } from "@std/assert";
import { prefersReducedMotion } from "@/lib/overlays/motion.ts";
import { hasIndexStages } from "@/lib/overlays/index_stages.tsx";
import {
  BARE_NO_WORK_TREE,
  isBareWithoutCheckout,
} from "@/lib/overlays/three_trees.tsx";
import {
  needsVisOverlay,
  visBareHeadLabel,
  visWorktreeDiamonds,
} from "@/lib/graph/render.ts";
import { stashHiwFromSnapshot } from "@/lib/graph/stash_hiw.ts";
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

Deno.test("prefersReducedMotion is false without matchMedia", () => {
  assertEquals(prefersReducedMotion(), false);
});

Deno.test("hasIndexStages is true only for stages 1/2/3", () => {
  assertEquals(hasIndexStages(emptySnap), false);
  assertEquals(
    hasIndexStages({
      ...emptySnap,
      index: [{ path: "f", blob: "aa", stage: 0 }],
    }),
    false,
  );
  assertEquals(
    hasIndexStages({
      ...emptySnap,
      index: [
        { path: "f", blob: "b1", stage: 1 },
        { path: "f", blob: "b2", stage: 2 },
        { path: "f", blob: "b3", stage: 3 },
      ],
    }),
    true,
  );
});

Deno.test("stashHiwFromSnapshot reads W parents as H then I", () => {
  const snap: Snapshot = {
    ...emptySnap,
    commits: [
      { id: "h".repeat(40), parents: [], message: "H" },
      { id: "i".repeat(40), parents: ["h".repeat(40)], message: "I" },
      {
        id: "w".repeat(40),
        parents: ["h".repeat(40), "i".repeat(40)],
        message: "W",
      },
    ],
    refs: [{ name: "refs/stash", target: "w".repeat(40), kind: "stash" }],
  };
  assertEquals(stashHiwFromSnapshot(snap), {
    h: "h".repeat(40),
    i: "i".repeat(40),
    w: "w".repeat(40),
  });
});

Deno.test("non-bare single worktree is a simple graph", () => {
  assertEquals(needsVisOverlay(emptySnap), false);
  assertEquals(visBareHeadLabel(emptySnap), false);
});

Deno.test("bare with no linked worktrees uses vis and a HEAD bare label", () => {
  const snap: Snapshot = { ...emptySnap, bare: true, worktrees: [] };
  assertEquals(needsVisOverlay(snap), true);
  assertEquals(visWorktreeDiamonds(snap), []);
  assertEquals(visBareHeadLabel(snap), true);
});

Deno.test("bare never draws a . worktree diamond", () => {
  const snap: Snapshot = {
    ...emptySnap,
    bare: true,
    worktrees: [
      { id: "main", path: ".", branch: "main" },
      { id: "hotfix", path: "../hotfix", branch: "hotfix" },
    ],
  };
  assertEquals(
    visWorktreeDiamonds(snap).map((w) => w.path),
    ["../hotfix"],
  );
  assertEquals(visBareHeadLabel(snap), false);
});

Deno.test("non-bare vis still draws the primary checkout diamond", () => {
  const snap: Snapshot = {
    ...emptySnap,
    worktrees: [
      { id: "main", path: ".", branch: "main" },
      { id: "hotfix", path: "../hotfix", branch: "hotfix" },
    ],
  };
  assertEquals(needsVisOverlay(snap), true);
  assertEquals(
    visWorktreeDiamonds(snap).map((w) => w.path),
    [".", "../hotfix"],
  );
});

Deno.test("three-trees copy for bare with no checkout", () => {
  const snap: Snapshot = {
    ...emptySnap,
    bare: true,
    worktrees: [],
    threeTrees: { worktree: [], index: [], head: ["README.md"] },
  };
  assertEquals(isBareWithoutCheckout(snap), true);
  assertEquals(BARE_NO_WORK_TREE, "no work tree (bare)");
  assertEquals(isBareWithoutCheckout(emptySnap), false);
});

Deno.test("three-trees copy stays normal when a linked worktree has files", () => {
  const snap: Snapshot = {
    ...emptySnap,
    bare: true,
    worktrees: [{ id: "hotfix", path: "../hotfix", branch: "hotfix" }],
    threeTrees: { worktree: ["a.txt"], index: ["a.txt"], head: ["a.txt"] },
  };
  assertEquals(isBareWithoutCheckout(snap), false);
});
