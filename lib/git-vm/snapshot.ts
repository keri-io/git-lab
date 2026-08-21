import {
  type CommitObject,
  GitError,
  type GitState,
  type GraphCommit,
  type GraphRef,
  type Snapshot,
  type WorktreeState,
} from "./types.ts";

/** Coerce missing `bare` so fixtures written before this field still load. */
export function coerceBare(state: GitState): GitState {
  if (state.bare !== true) state.bare = false;
  if (state.conflictStyle !== "diff3" && state.conflictStyle !== "zdiff3") {
    state.conflictStyle = "merge";
  }
  if (typeof state.rerereEnabled !== "boolean") state.rerereEnabled = false;
  if (!state.rerereCache) state.rerereCache = {};
  return state;
}

/** Linked (or primary) worktree Git will use, or undefined on a bare repo with none. */
export function findActiveWorktree(state: GitState): WorktreeState | undefined {
  if (state.worktrees.length === 0) return undefined;
  const wt = state.worktrees.find((w) => w.id === state.activeWorktree);
  if (wt) return wt;
  if (state.bare === true) return state.worktrees[0];
  return undefined;
}

export function activeWorktree(state: GitState): WorktreeState {
  const wt = findActiveWorktree(state);
  if (wt) return wt;
  if (state.bare === true || state.worktrees.length === 0) {
    throw new GitError("fatal: this operation must be run in a work tree");
  }
  throw new Error(`missing worktree ${state.activeWorktree}`);
}

/** Repo-level HEAD (symbolic ref or detached id), ignoring linked worktrees. */
export function resolveRepoHead(state: GitState): string | null {
  if (state.HEAD.startsWith("refs/")) return state.refs[state.HEAD] ?? null;
  return state.HEAD || null;
}

/**
 * Tip of the active checkout. With zero worktrees (bare), this is `state.HEAD`
 * resolved through refs — the default branch still has a tip.
 */
export function resolveHead(state: GitState): string | null {
  const wt = findActiveWorktree(state);
  if (wt?.head) return wt.head;
  return resolveRepoHead(state);
}

function headBranch(
  state: GitState,
  wt: WorktreeState | undefined,
): string | null {
  if (wt) return wt.branch;
  if (state.HEAD.startsWith("refs/heads/")) {
    return state.HEAD.slice("refs/heads/".length);
  }
  return null;
}

export function snapshotOf(state: GitState): Snapshot {
  const bare = state.bare === true;
  const wt = findActiveWorktree(state);
  if (!wt && !bare && state.worktrees.length > 0) {
    throw new Error(`missing worktree ${state.activeWorktree}`);
  }
  const commits: GraphCommit[] = Object.values(state.objects)
    .filter((o): o is CommitObject => o.type === "commit")
    .map((c) => ({
      id: c.id,
      parents: c.parents,
      message: c.message,
    }));

  const reachable = new Set<string>();
  const walk = (id: string | null | undefined) => {
    if (!id || reachable.has(id)) return;
    reachable.add(id);
    const obj = state.objects[id];
    if (obj?.type === "commit") obj.parents.forEach(walk);
    if (obj?.type === "tag") walk(obj.object);
  };
  Object.values(state.refs).forEach(walk);
  state.stash.forEach(walk);
  for (const r of Object.values(state.remotes)) {
    Object.values(r.refs).forEach(walk);
  }

  for (const c of commits) {
    c.dangling = !reachable.has(c.id);
  }

  const refs: GraphRef[] = [];
  for (const [name, raw] of Object.entries(state.refs)) {
    const peeled = state.objects[raw];
    const target = peeled?.type === "tag" ? peeled.object : raw;
    const kind = name.startsWith("refs/remotes/")
      ? "remote"
      : name.startsWith("refs/stash")
      ? "stash"
      : name.startsWith("refs/tags/")
      ? "tag"
      : name.startsWith("refs/heads/")
      ? "branch"
      : "special";
    refs.push({ name, target, kind });
  }
  const headId = resolveHead(state);
  if (headId) refs.push({ name: "HEAD", target: headId, kind: "head" });
  for (const [i, sid] of state.stash.entries()) {
    refs.push({ name: `stash@{${i}}`, target: sid, kind: "stash" });
  }

  const headCommit = headId ? state.objects[headId] : null;
  const headTree = headCommit && headCommit.type === "commit"
    ? headCommit.tree
    : null;
  const index = wt?.index ?? [];
  const files = wt ? { ...wt.files } : {};

  return {
    commits,
    refs,
    head: headId,
    branch: headBranch(state, wt),
    index,
    files,
    conflicted: state.conflicted,
    bare,
    worktrees: state.worktrees.map((w) => ({
      id: w.id,
      path: w.path,
      branch: w.branch,
    })),
    threeTrees: {
      worktree: Object.keys(files).sort(),
      index: index.filter((e) => e.stage === 0).map((e) => e.path).sort(),
      head: headTree
        ? (state.objects[headTree]?.type === "tree"
          ? state.objects[headTree].entries.map((e) => e.name).sort()
          : [])
        : [],
    },
  };
}
