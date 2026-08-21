import type { Snapshot } from "../git-vm/types.ts";

function isPrimaryCheckoutPath(path: string): boolean {
  return path === "." || path === "";
}

/**
 * Worktrees that get extra graph glyphs. A bare repo never draws a diamond
 * for a primary `.` checkout that does not exist.
 */
export function visWorktreeDiamonds(
  snapshot: Snapshot,
): Snapshot["worktrees"] {
  return snapshot.worktrees.filter((wt) =>
    !(snapshot.bare && isPrimaryCheckoutPath(wt.path))
  );
}

/** Bare repo with no linked checkouts: draw a small `bare` node on HEAD. */
export function visBareHeadLabel(snapshot: Snapshot): boolean {
  return !!snapshot.bare && visWorktreeDiamonds(snapshot).length === 0;
}

/** Stash two-parent W, more than one worktree, or a bare repo. */
export function needsVisOverlay(snapshot: Snapshot): boolean {
  if (snapshot.bare) return true;
  if (snapshot.worktrees.length > 1) return true;
  const stashTargets = new Set(
    snapshot.refs.filter((r) => r.kind === "stash").map((r) => r.target),
  );
  return snapshot.commits.some((c) =>
    stashTargets.has(c.id) && c.parents.length >= 2
  );
}
