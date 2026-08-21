import { cloneJson } from "../git-vm/clone.ts";
import {
  emptyState,
  makeCommit,
  originFixture,
  seededLocalFromOrigin,
} from "../git-vm/fixtures.ts";
import { checkoutCommit } from "../git-vm/repo.ts";
import type { GitObject, GitState } from "../git-vm/types.ts";

export {
  checkoutCommit,
  cloneJson,
  emptyState,
  makeCommit,
  makeCommit as writeCommit,
  originFixture,
  seededLocalFromOrigin,
};

export function commitOnBranch(
  state: GitState,
  branch: string,
  message: string,
  files: Record<string, string>,
  opts?: { checkout?: boolean; from?: string },
): string {
  const ref = `refs/heads/${branch}`;
  const parent = opts?.from ?? state.refs[ref];
  if (!parent) throw new Error(`commitOnBranch: no parent for ${branch}`);
  const { commit, objects } = makeCommit(message, [parent], files);
  Object.assign(state.objects, objects);
  const oldId = state.refs[ref] ?? null;
  state.refs[ref] = commit.id;
  const onThisBranch = state.worktrees[0].branch === branch;
  if (opts?.checkout || (opts?.checkout !== false && onThisBranch)) {
    state.HEAD = ref;
    state.worktrees[0].branch = branch;
    checkoutCommit(state, commit.id);
  }
  state.reflog.push({
    oldId,
    newId: commit.id,
    message: `commit: ${message}`,
  });
  return commit.id;
}

export function commitOnRemote(
  state: GitState,
  remoteName: string,
  message: string,
  files: Record<string, string>,
): string {
  const remote = state.remotes[remoteName];
  if (!remote) throw new Error(`commitOnRemote: no remote ${remoteName}`);
  const parent = remote.refs["refs/heads/main"];
  if (!parent) throw new Error(`commitOnRemote: ${remoteName} has no main`);
  const { commit, objects } = makeCommit(message, [parent], files);
  Object.assign(remote.objects, objects);
  remote.refs["refs/heads/main"] = commit.id;
  return commit.id;
}

export function attachUpstreamCopy(state: GitState): void {
  const origin = state.remotes.origin;
  if (!origin) throw new Error("attachUpstreamCopy: origin missing");
  state.remotes.upstream = {
    name: "upstream",
    objects: { ...origin.objects },
    refs: { ...origin.refs },
  };
}

export function mainTip(state: GitState): string {
  const id = state.refs["refs/heads/main"];
  if (!id) throw new Error("mainTip: refs/heads/main missing");
  return id;
}

export function reachableCount(state: GitState, tip: string | null): number {
  if (!tip) return 0;
  let n = 0;
  let cur: string | undefined = tip;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const obj: GitObject | undefined = state.objects[cur];
    if (!obj || obj.type !== "commit") break;
    n++;
    cur = obj.parents[0];
  }
  return n;
}

export function treeHas(
  state: GitState,
  commitId: string,
  path: string,
): boolean {
  const obj = state.objects[commitId];
  if (!obj || obj.type !== "commit") return false;
  const tree = state.objects[obj.tree];
  if (!tree || tree.type !== "tree") return false;
  return tree.entries.some((e) => e.name === path);
}
