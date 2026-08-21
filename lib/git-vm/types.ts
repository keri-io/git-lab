/** Shared contract for the in-memory teaching Git. Do not change without updating tests. */

export type ObjectId = string;

export interface BlobObject {
  type: "blob";
  id: ObjectId;
  content: string;
}

export interface TreeEntry {
  name: string;
  mode: "100644" | "100755" | "040000";
  id: ObjectId;
}

export interface TreeObject {
  type: "tree";
  id: ObjectId;
  entries: TreeEntry[];
}

export interface CommitObject {
  type: "commit";
  id: ObjectId;
  tree: ObjectId;
  parents: ObjectId[];
  message: string;
  author: string;
}

export type GitObject = BlobObject | TreeObject | CommitObject;

export interface IndexEntry {
  path: string;
  blob: ObjectId;
  /** 0 = merged; 1 = base; 2 = ours; 3 = theirs */
  stage: 0 | 1 | 2 | 3;
}

export interface WorktreeFiles {
  [path: string]: string;
}

export interface WorktreeState {
  id: string;
  path: string;
  head: ObjectId | null;
  branch: string | null;
  index: IndexEntry[];
  files: WorktreeFiles;
}

export interface RemoteStore {
  name: string;
  objects: Record<ObjectId, GitObject>;
  refs: Record<string, ObjectId>;
}

export interface ReflogEntry {
  oldId: ObjectId | null;
  newId: ObjectId | null;
  message: string;
}

export class GitError extends Error {
  override name = "GitError";
  constructor(message: string) {
    super(message.endsWith("\n") ? message : `${message}\n`);
  }
}

export interface GitState {
  objects: Record<ObjectId, GitObject>;
  refs: Record<string, ObjectId>;
  /** Symbolic ref, e.g. refs/heads/main, or a detached commit id. */
  HEAD: string;
  remotes: Record<string, RemoteStore>;
  /**
   * Non-bare: worktrees[0] is the primary checkout at `.`.
   * Bare: worktrees is only linked worktrees (may be empty). HEAD still lives here.
   */
  bare: boolean;
  worktrees: WorktreeState[];
  activeWorktree: string;
  reflog: ReflogEntry[];
  stash: ObjectId[];
  conflicted: boolean;
  cherryPickHead: ObjectId | null;
  rebaseTodos: string[];
}

/** Serializable view the graph libraries consume. */
export interface GraphCommit {
  id: ObjectId;
  parents: ObjectId[];
  message: string;
  dangling?: boolean;
}

export interface GraphRef {
  name: string;
  target: ObjectId;
  kind: "head" | "branch" | "remote" | "stash" | "special";
}

export interface Snapshot {
  commits: GraphCommit[];
  refs: GraphRef[];
  head: ObjectId | null;
  branch: string | null;
  index: IndexEntry[];
  files: WorktreeFiles;
  conflicted: boolean;
  bare: boolean;
  worktrees: { id: string; path: string; branch: string | null }[];
  threeTrees: {
    worktree: string[];
    index: string[];
    head: string[];
  };
}

/** Animation hints for the graph overlay. Empty when nothing happened. */
export interface GitEvent {
  type: string;
  payload?: unknown;
}

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  snapshot: Snapshot;
  events: GitEvent[];
}

export type Porcelain =
  | "init"
  | "clone"
  | "status"
  | "log"
  | "switch"
  | "checkout"
  | "branch"
  | "add"
  | "commit"
  | "reset"
  | "reflog"
  | "remote"
  | "fetch"
  | "pull"
  | "merge"
  | "rebase"
  | "cherry-pick"
  | "stash"
  | "worktree"
  | "revert"
  | "cat-file"
  | "ls-files";
