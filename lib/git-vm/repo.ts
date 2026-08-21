/** Teaching-Git primitives: objects, refs, three-way merge, checkout. */

import { emit } from "./events.ts";
import { hashObject } from "./hash.ts";
import { activeWorktree, resolveHead } from "./snapshot.ts";
import {
  type CommitObject,
  GitError,
  type GitState,
  type IndexEntry,
  type TreeEntry,
  type TreeObject,
} from "./types.ts";

export { GitError };

export const AUTHOR = "learner";
export const AUTHOR_LINE = "author learner <learner@git-lab>";

export function storeBlob(state: GitState, content: string): string {
  const id = hashObject("blob", content);
  state.objects[id] = { type: "blob", id, content };
  return id;
}

export function storeTree(
  state: GitState,
  files: Record<string, string>,
): string {
  const entries: TreeEntry[] = Object.keys(files).sort().map((name) => {
    const id = storeBlob(state, files[name]);
    return { name, mode: "100644" as const, id };
  });
  const treeBody = entries.map((e) => `${e.mode} ${e.name} ${e.id}`).join(
    "\n",
  );
  const id = hashObject("tree", treeBody);
  const tree: TreeObject = { type: "tree", id, entries };
  state.objects[id] = tree;
  return id;
}

export function storeCommit(
  state: GitState,
  tree: string,
  parents: string[],
  message: string,
): string {
  const commitBody = [
    `tree ${tree}`,
    ...parents.map((p) => `parent ${p}`),
    AUTHOR_LINE,
    "",
    message,
  ].join("\n");
  const id = hashObject("commit", commitBody);
  state.objects[id] = {
    type: "commit",
    id,
    tree,
    parents,
    message,
    author: AUTHOR,
  };
  return id;
}

export function asCommit(state: GitState, id: string): CommitObject {
  const obj = state.objects[id];
  if (!obj || obj.type !== "commit") {
    throw new GitError(`fatal: not a commit: ${id}`);
  }
  return obj;
}

export function treeFiles(
  state: GitState,
  treeId: string,
  prefix = "",
): Record<string, string> {
  const obj = state.objects[treeId];
  if (!obj || obj.type !== "tree") return {};
  const out: Record<string, string> = {};
  for (const e of obj.entries) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    const child = state.objects[e.id];
    if (child?.type === "blob") out[path] = child.content;
    else if (child?.type === "tree") {
      Object.assign(out, treeFiles(state, e.id, path));
    }
  }
  return out;
}

export function commitFiles(
  state: GitState,
  commitId: string,
): Record<string, string> {
  const c = asCommit(state, commitId);
  return treeFiles(state, c.tree);
}

export function indexFromFiles(
  state: GitState,
  files: Record<string, string>,
): IndexEntry[] {
  return Object.keys(files).sort().map((path) => ({
    path,
    blob: storeBlob(state, files[path]),
    stage: 0 as const,
  }));
}

export function filesFromIndex(
  state: GitState,
  index: IndexEntry[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of index) {
    if (e.stage !== 0) continue;
    const b = state.objects[e.blob];
    if (b?.type === "blob") out[e.path] = b.content;
  }
  return out;
}

export function treeFromIndex(state: GitState, index: IndexEntry[]): string {
  return storeTree(state, filesFromIndex(state, index));
}

export function updateConflicted(state: GitState): void {
  const wt = activeWorktree(state);
  state.conflicted = wt.index.some((e) => e.stage !== 0);
}

export function hasUnmerged(state: GitState): boolean {
  return activeWorktree(state).index.some((e) => e.stage !== 0);
}

export function appendReflog(
  state: GitState,
  oldId: string | null,
  newId: string | null,
  message: string,
): void {
  state.reflog.unshift({ oldId, newId, message });
}

export function lookupRef(state: GitState, name: string): string | null {
  if (name === "HEAD" || name === "@") return resolveHead(state);
  const stashM = name.match(/^stash@\{(\d+)\}$/);
  if (stashM) return state.stash[Number(stashM[1])] ?? null;
  if (state.refs[name]) return state.refs[name];
  if (state.refs[`refs/heads/${name}`]) return state.refs[`refs/heads/${name}`];
  if (state.refs[`refs/remotes/${name}`]) {
    return state.refs[`refs/remotes/${name}`];
  }
  if (state.objects[name]) return name;
  const matches = Object.keys(state.objects).filter((id) =>
    id.startsWith(name) && name.length >= 4
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new GitError(`fatal: ambiguous argument '${name}'`);
  }
  return null;
}

/** HEAD~1 = first parent of current HEAD. Also HEAD~n, names, hashes. */
export function resolveRevision(state: GitState, rev: string): string {
  let base = rev;
  let walk = 0;
  const tilde = rev.match(/^(.*)~(\d+)$/);
  if (tilde) {
    base = tilde[1];
    walk = Number(tilde[2]);
  } else {
    const caret = rev.match(/^(.*)\^(\d*)$/);
    if (caret) {
      base = caret[1];
      walk = Number(caret[2] || "1");
    }
  }
  const id = lookupRef(state, base);
  if (!id) throw new GitError(`fatal: invalid revision: ${rev}`);
  let cur = id;
  for (let i = 0; i < walk; i++) {
    const c = asCommit(state, cur);
    if (!c.parents[0]) {
      throw new GitError(`fatal: unknown revision ${rev}`);
    }
    cur = c.parents[0];
  }
  return cur;
}

export function ancestorSet(state: GitState, id: string | null): Set<string> {
  const out = new Set<string>();
  const walk = (x: string | null | undefined) => {
    if (!x || out.has(x)) return;
    out.add(x);
    const obj = state.objects[x];
    if (obj?.type === "commit") obj.parents.forEach(walk);
  };
  walk(id);
  return out;
}

export function isAncestor(
  state: GitState,
  maybeAncestor: string,
  descendant: string,
): boolean {
  return ancestorSet(state, descendant).has(maybeAncestor);
}

export function mergeBase(
  state: GitState,
  a: string,
  b: string,
): string | null {
  const ancA = ancestorSet(state, a);
  const walk: string[] = [b];
  const seen = new Set<string>();
  while (walk.length) {
    const id = walk.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (ancA.has(id)) return id;
    const obj = state.objects[id];
    if (obj?.type === "commit") walk.push(...obj.parents);
  }
  return null;
}

/** Commits reachable from `from` but not from `onto`, oldest first. Skips merges. */
export function uniqueCommits(
  state: GitState,
  from: string,
  onto: string,
): string[] {
  const ontoSet = ancestorSet(state, onto);
  const result: string[] = [];
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (ontoSet.has(id) || seen.has(id)) return;
    seen.add(id);
    const c = asCommit(state, id);
    for (const p of c.parents) walk(p);
    if (c.parents.length <= 1) result.push(id);
  };
  walk(from);
  return result;
}

export function setBranchTip(
  state: GitState,
  branch: string,
  id: string,
): void {
  const ref = `refs/heads/${branch}`;
  const from = state.refs[ref] ?? null;
  state.refs[ref] = id;
  emit(state, "ref-move", { ref, from, to: id });
  for (const w of state.worktrees) {
    if (w.branch === branch) w.head = id;
  }
}

export function moveHead(
  state: GitState,
  id: string,
  reflogMessage: string,
): void {
  const wt = activeWorktree(state);
  const old = resolveHead(state);
  wt.head = id;
  if (wt.branch) {
    setBranchTip(state, wt.branch, id);
    if (wt.id === state.activeWorktree) {
      state.HEAD = `refs/heads/${wt.branch}`;
    }
  } else if (wt.id === state.activeWorktree) {
    state.HEAD = id;
    emit(state, "ref-move", { ref: "HEAD", from: old, to: id });
  }
  appendReflog(state, old, id, reflogMessage);
}

export function checkoutCommit(state: GitState, commitId: string): void {
  const wt = activeWorktree(state);
  const files = commitFiles(state, commitId);
  wt.files = { ...files };
  wt.index = indexFromFiles(state, files);
  wt.head = commitId;
  updateConflicted(state);
}

export function worktreeIsDirty(state: GitState): boolean {
  const head = resolveHead(state);
  const headFiles = head ? commitFiles(state, head) : {};
  const wt = activeWorktree(state);
  const paths = new Set([
    ...Object.keys(headFiles),
    ...Object.keys(wt.files),
  ]);
  for (const p of paths) {
    if ((headFiles[p] ?? undefined) !== (wt.files[p] ?? undefined)) {
      return true;
    }
  }
  return hasUnmerged(state);
}

export function conflictMarkers(
  ours: string,
  theirs: string,
  label: string,
): string {
  const o = ours.endsWith("\n") || ours === "" ? ours : `${ours}\n`;
  const t = theirs.endsWith("\n") || theirs === "" ? theirs : `${theirs}\n`;
  return `<<<<<<< HEAD\n${o}=======\n${t}>>>>>>> ${label}\n`;
}

export interface MergeResult {
  files: Record<string, string>;
  index: IndexEntry[];
  conflicted: boolean;
  conflicts: string[];
}

export function threeWayMerge(
  state: GitState,
  baseFiles: Record<string, string>,
  oursFiles: Record<string, string>,
  theirsFiles: Record<string, string>,
  theirsLabel: string,
): MergeResult {
  const paths = new Set([
    ...Object.keys(baseFiles),
    ...Object.keys(oursFiles),
    ...Object.keys(theirsFiles),
  ]);
  const files: Record<string, string> = {};
  const index: IndexEntry[] = [];
  const conflicts: string[] = [];

  for (const path of [...paths].sort()) {
    const base = baseFiles[path];
    const ours = oursFiles[path];
    const theirs = theirsFiles[path];
    const baseId = base !== undefined ? storeBlob(state, base) : undefined;
    const oursId = ours !== undefined ? storeBlob(state, ours) : undefined;
    const theirsId = theirs !== undefined
      ? storeBlob(state, theirs)
      : undefined;

    if (ours === theirs) {
      if (ours !== undefined && oursId) {
        files[path] = ours;
        index.push({ path, blob: oursId, stage: 0 });
      }
      continue;
    }
    if (ours === base) {
      if (theirs !== undefined && theirsId) {
        files[path] = theirs;
        index.push({ path, blob: theirsId, stage: 0 });
      }
      continue;
    }
    if (theirs === base) {
      if (ours !== undefined && oursId) {
        files[path] = ours;
        index.push({ path, blob: oursId, stage: 0 });
      }
      continue;
    }

    conflicts.push(path);
    if (baseId) index.push({ path, blob: baseId, stage: 1 });
    if (oursId) index.push({ path, blob: oursId, stage: 2 });
    if (theirsId) index.push({ path, blob: theirsId, stage: 3 });
    if (ours !== undefined && theirs !== undefined) {
      files[path] = conflictMarkers(ours, theirs, theirsLabel);
    } else if (ours !== undefined) {
      files[path] = ours;
    } else if (theirs !== undefined) {
      files[path] = theirs;
    }
  }

  return { files, index, conflicted: conflicts.length > 0, conflicts };
}

export function applyMergeToWorktree(
  state: GitState,
  result: MergeResult,
): void {
  const wt = activeWorktree(state);
  wt.files = result.files;
  wt.index = result.index;
  updateConflicted(state);
  if (result.conflicted) {
    emit(state, "index-stages", {
      paths: result.conflicts,
      stages: [1, 2, 3],
    });
  }
}

export function createCommitFromIndex(
  state: GitState,
  message: string,
  parents: string[],
  reflogMessage: string,
): string {
  if (hasUnmerged(state)) {
    throw new GitError(
      "error: Committing is not possible because you have unmerged files.",
    );
  }
  const wt = activeWorktree(state);
  const tree = treeFromIndex(state, wt.index);
  const id = storeCommit(state, tree, parents, message);
  moveHead(state, id, reflogMessage);
  return id;
}

export function resetTo(
  state: GitState,
  targetId: string,
  mode: "soft" | "mixed" | "hard",
): void {
  const wt = activeWorktree(state);
  moveHead(state, targetId, `reset: moving to ${targetId.slice(0, 7)}`);
  if (mode === "mixed" || mode === "hard") {
    wt.index = indexFromFiles(state, commitFiles(state, targetId));
  }
  if (mode === "hard") {
    wt.files = { ...commitFiles(state, targetId) };
  }
  if (mode === "hard") {
    delete state.refs["MERGE_HEAD"];
    state.cherryPickHead = null;
    state.rebaseTodos = [];
  }
  updateConflicted(state);
}

export function prettyObject(state: GitState, id: string): string {
  const obj = state.objects[id];
  if (!obj) throw new GitError(`fatal: Not a valid object name ${id}`);
  if (obj.type === "blob") return obj.content;
  if (obj.type === "tree") {
    return obj.entries.map((e) => `${e.mode} ${e.name} ${e.id}`).join("\n") +
      (obj.entries.length ? "\n" : "");
  }
  const lines = [
    `tree ${obj.tree}`,
    ...obj.parents.map((p) => `parent ${p}`),
    AUTHOR_LINE,
    "",
    obj.message,
  ];
  return lines.join("\n") + (obj.message.endsWith("\n") ? "" : "\n");
}

export function branchCheckedOut(
  state: GitState,
  branch: string,
): string | null {
  for (const w of state.worktrees) {
    if (w.branch === branch) return w.path;
  }
  return null;
}

export function copyRemoteObjects(
  state: GitState,
  remoteName: string,
): void {
  const remote = state.remotes[remoteName];
  if (!remote) {
    throw new GitError(
      `fatal: '${remoteName}' does not appear to be a git remote`,
    );
  }
  Object.assign(state.objects, remote.objects);
  emit(state, "pack-arrival", {
    remote: remoteName,
    objects: Object.keys(remote.objects).length,
  });
  for (const [ref, id] of Object.entries(remote.refs)) {
    const tracked = ref.startsWith("refs/heads/")
      ? `refs/remotes/${remoteName}/${ref.slice("refs/heads/".length)}`
      : `refs/remotes/${remoteName}/${ref}`;
    const from = state.refs[tracked] ?? null;
    state.refs[tracked] = id;
    emit(state, "ref-move", { ref: tracked, from, to: id });
  }
}

export function currentBranch(state: GitState): string | null {
  const wt = state.worktrees.find((w) => w.id === state.activeWorktree);
  if (wt) return wt.branch;
  if (state.HEAD.startsWith("refs/heads/")) {
    return state.HEAD.slice("refs/heads/".length);
  }
  return null;
}

export function nameForCommit(state: GitState, id: string): string {
  for (const [name, target] of Object.entries(state.refs)) {
    if (target !== id) continue;
    if (name.startsWith("refs/heads/")) return name.slice("refs/heads/".length);
    if (name.startsWith("refs/remotes/")) {
      return name.slice("refs/remotes/".length);
    }
  }
  return id.slice(0, 7);
}
