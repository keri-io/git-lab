import { hashObject } from "./hash.ts";
import type {
  CommitObject,
  GitState,
  RemoteStore,
  TreeObject,
} from "./types.ts";

export function emptyState(): GitState {
  return {
    objects: {},
    refs: {},
    HEAD: "refs/heads/main",
    remotes: {},
    bare: false,
    worktrees: [{
      id: "main",
      path: ".",
      head: null,
      branch: "main",
      index: [],
      files: {},
    }],
    activeWorktree: "main",
    reflog: [],
    stash: [],
    conflicted: false,
    cherryPickHead: null,
    rebaseTodos: [],
    conflictStyle: "merge",
    rerereEnabled: false,
    rerereCache: {},
  };
}

export function makeCommit(
  message: string,
  parents: string[],
  files: Record<string, string>,
): { commit: CommitObject; objects: GitState["objects"] } {
  const objects: GitState["objects"] = {};
  const entries = Object.entries(files).map(([name, content]) => {
    const blobId = hashObject("blob", content);
    objects[blobId] = { type: "blob", id: blobId, content };
    return { name, mode: "100644" as const, id: blobId };
  });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const treeBody = entries.map((e) => `${e.mode} ${e.name} ${e.id}`).join("\n");
  const treeId = hashObject("tree", treeBody);
  const tree: TreeObject = { type: "tree", id: treeId, entries };
  objects[treeId] = tree;
  const commitBody = [
    `tree ${treeId}`,
    ...parents.map((p) => `parent ${p}`),
    "author learner <learner@git-lab>",
    "",
    message,
  ].join("\n");
  const id = hashObject("commit", commitBody);
  const c: CommitObject = {
    type: "commit",
    id,
    tree: treeId,
    parents,
    message,
    author: "learner",
  };
  objects[id] = c;
  return { commit: c, objects };
}

/** A remote named origin with main at one commit (README). */
export function originFixture(): { remote: RemoteStore; tip: string } {
  const { commit: c, objects } = makeCommit("initial", [], {
    "README.md": "# demo\n",
  });
  return {
    tip: c.id,
    remote: {
      name: "origin",
      objects,
      refs: { "refs/heads/main": c.id },
    },
  };
}

export function seededLocalFromOrigin(): GitState {
  const { remote, tip } = originFixture();
  const state = emptyState();
  state.objects = { ...remote.objects };
  state.refs["refs/heads/main"] = tip;
  state.refs["refs/remotes/origin/main"] = tip;
  state.HEAD = "refs/heads/main";
  state.remotes.origin = remote;
  const wt = state.worktrees[0];
  wt.head = tip;
  wt.branch = "main";
  wt.files = { "README.md": "# demo\n" };
  const blob = Object.values(remote.objects).find((o) => o.type === "blob");
  if (blob && blob.type === "blob") {
    wt.index = [{ path: "README.md", blob: blob.id, stage: 0 }];
  }
  state.reflog.push({
    oldId: null,
    newId: tip,
    message: "clone: checkout main",
  });
  return state;
}

/** Origin objects/refs with no checkout — the server shape of clone --bare. */
export function bareFromOrigin(): GitState {
  const { remote, tip } = originFixture();
  const state = emptyState();
  state.bare = true;
  state.objects = { ...remote.objects };
  state.refs["refs/heads/main"] = tip;
  state.refs["refs/remotes/origin/main"] = tip;
  state.HEAD = "refs/heads/main";
  state.remotes.origin = remote;
  state.worktrees = [];
  state.activeWorktree = "";
  return state;
}
