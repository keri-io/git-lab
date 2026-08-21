/** Porcelain command implementations for the teaching Git VM. */

import { emit } from "../git-vm/events.ts";
import {
  activeWorktree,
  resolveHead,
  resolveRepoHead,
} from "../git-vm/snapshot.ts";
import {
  ancestorSet,
  appendReflog,
  applyMergeToWorktree,
  asCommit,
  branchCheckedOut,
  checkoutCommit,
  commitFiles,
  copyRemoteObjects,
  createCommitFromIndex,
  currentBranch,
  hasUnmerged,
  indexFromFiles,
  isAncestor,
  lookupRef,
  mergeBase,
  moveHead,
  nameForCommit,
  prettyObject,
  resetTo,
  resolveRevision,
  storeBlob,
  storeCommit,
  storeTree,
  threeWayMerge,
  uniqueCommits,
  updateConflicted,
  worktreeIsDirty,
} from "../git-vm/repo.ts";
import type { GitState, IndexEntry } from "../git-vm/types.ts";
import { takeFlag, takeOption } from "./parse.ts";

export interface CmdResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

function ok(stdout = ""): CmdResult {
  return { ok: true, stdout, stderr: "" };
}

function fail(stderr: string): CmdResult {
  const msg = stderr.endsWith("\n") ? stderr : `${stderr}\n`;
  return { ok: false, stdout: "", stderr: msg };
}

const KNOWN = [
  "init",
  "clone",
  "status",
  "log",
  "switch",
  "checkout",
  "branch",
  "add",
  "commit",
  "reset",
  "reflog",
  "remote",
  "fetch",
  "pull",
  "merge",
  "rebase",
  "cherry-pick",
  "stash",
  "worktree",
  "revert",
  "cat-file",
  "ls-files",
];

export function dispatchGit(state: GitState, argv: string[]): CmdResult {
  if (argv.length === 0) return ok();
  if (argv[0] === "edit") return cmdEdit(state, argv.slice(1));
  if (argv[0] !== "git") {
    return fail(
      `git-lab: not a git command: '${argv[0]}'. Prefix porcelain with git.`,
    );
  }
  if (argv.length === 1) {
    return fail("usage: git <command> [<args>]");
  }
  const cmd = argv[1];
  const args = argv.slice(2);
  switch (cmd) {
    case "init":
      return cmdInit(state, args);
    case "clone":
      return cmdClone(state, args);
    case "status":
      return cmdStatus(state);
    case "log":
      return cmdLog(state, args);
    case "switch":
      return cmdSwitch(state, args);
    case "checkout":
      return cmdCheckout(state, args);
    case "branch":
      return cmdBranch(state, args);
    case "add":
      return cmdAdd(state, args);
    case "commit":
      return cmdCommit(state, args);
    case "reset":
      return cmdReset(state, args);
    case "reflog":
      return cmdReflog(state);
    case "remote":
      return cmdRemote(state, args);
    case "fetch":
      return cmdFetch(state, args);
    case "pull":
      return cmdPull(state, args);
    case "merge":
      return cmdMerge(state, args);
    case "rebase":
      return cmdRebase(state, args);
    case "cherry-pick":
      return cmdCherryPick(state, args);
    case "stash":
      return cmdStash(state, args);
    case "worktree":
      return cmdWorktree(state, args);
    case "revert":
      return cmdRevert(state, args);
    case "cat-file":
      return cmdCatFile(state, args);
    case "ls-files":
      return cmdLsFiles(state, args);
    default:
      return fail(
        `git: '${cmd}' is not a git-lab command. Known: ${KNOWN.join(", ")}.`,
      );
  }
}

function cmdInit(state: GitState, args: string[]): CmdResult {
  const bare = takeFlag(args, "--bare");
  if (!bare) {
    state.bare = false;
    if (state.worktrees.length === 0) {
      state.worktrees = [{
        id: "main",
        path: ".",
        head: null,
        branch: "main",
        index: [],
        files: {},
      }];
      state.activeWorktree = "main";
    }
    if (!state.HEAD) state.HEAD = "refs/heads/main";
    return ok("Initialized empty Git repository\n");
  }
  state.bare = true;
  state.worktrees = [];
  state.activeWorktree = "";
  state.HEAD = "refs/heads/main";
  emit(state, "bare");
  return ok("Initialized empty Git repository (bare)\n");
}

function cmdClone(state: GitState, args: string[]): CmdResult {
  const bare = takeFlag(args, "--bare");
  const remoteName = args.find((a) => !a.startsWith("-")) ?? "origin";
  if (!bare) {
    return fail(
      "git-lab: git clone without --bare is not a verb here; fetch then checkout, or git clone --bare.",
    );
  }
  const remote = state.remotes[remoteName];
  if (!remote) {
    return fail(`fatal: repository '${remoteName}' does not exist`);
  }
  Object.assign(state.objects, remote.objects);
  for (const [ref, id] of Object.entries(remote.refs)) {
    if (ref.startsWith("refs/heads/")) {
      state.refs[ref] = id;
      const short = ref.slice("refs/heads/".length);
      state.refs[`refs/remotes/${remoteName}/${short}`] = id;
    } else {
      state.refs[ref] = id;
    }
  }
  state.bare = true;
  state.worktrees = [];
  state.activeWorktree = "";
  state.HEAD = "refs/heads/main";
  emit(state, "bare", { remote: remoteName });
  return ok(`Cloning into bare repository from '${remoteName}'\n`);
}

function cmdStatus(state: GitState): CmdResult {
  const wt = activeWorktree(state);
  const head = resolveHead(state);
  const branch = wt.branch;
  const lines: string[] = [];
  if (branch) lines.push(`On branch ${branch}`);
  else lines.push(`HEAD detached at ${head?.slice(0, 7) ?? "unknown"}`);

  if (branch && head) {
    const remote = state.refs[`refs/remotes/origin/${branch}`];
    if (remote) {
      if (remote === head) {
        lines.push(`Your branch is up to date with 'origin/${branch}'.`);
      } else if (isAncestor(state, head, remote)) {
        lines.push(`Your branch is behind 'origin/${branch}'.`);
      } else if (isAncestor(state, remote, head)) {
        lines.push(`Your branch is ahead of 'origin/${branch}'.`);
      } else {
        lines.push(`Your branch and 'origin/${branch}' have diverged.`);
      }
    }
  }

  if (!head) lines.push("No commits yet");

  const headFiles = head ? commitFiles(state, head) : {};
  const indexFiles: Record<string, string> = {};
  const unmerged = new Map<string, IndexEntry[]>();
  for (const e of wt.index) {
    if (e.stage !== 0) {
      const list = unmerged.get(e.path) ?? [];
      list.push(e);
      unmerged.set(e.path, list);
      continue;
    }
    const b = state.objects[e.blob];
    if (b?.type === "blob") indexFiles[e.path] = b.content;
  }

  if (unmerged.size) {
    lines.push("You have unmerged paths.");
    lines.push("Unmerged paths:");
    for (const p of [...unmerged.keys()].sort()) {
      lines.push(`\tboth modified:   ${p}`);
    }
  }

  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];
  const paths = new Set([
    ...Object.keys(headFiles),
    ...Object.keys(indexFiles),
    ...Object.keys(wt.files),
  ]);
  for (const p of [...paths].sort()) {
    if (unmerged.has(p)) continue;
    const h = headFiles[p];
    const i = indexFiles[p];
    const w = wt.files[p];
    if (i !== undefined && i !== h) {
      staged.push(
        h === undefined ? `\tnew file:   ${p}` : `\tmodified:   ${p}`,
      );
    } else if (i === undefined && h !== undefined) {
      staged.push(`\tdeleted:    ${p}`);
    }
    if (i !== undefined && w !== undefined && w !== i) {
      unstaged.push(`\tmodified:   ${p}`);
    } else if (i !== undefined && w === undefined) {
      unstaged.push(`\tdeleted:    ${p}`);
    } else if (i === undefined && w !== undefined && h === undefined) {
      untracked.push(`\t${p}`);
    }
  }

  if (staged.length) {
    lines.push("Changes to be committed:");
    lines.push(...staged);
  }
  if (unstaged.length) {
    lines.push("Changes not staged for commit:");
    lines.push(...unstaged);
  }
  if (untracked.length) {
    lines.push("Untracked files:");
    lines.push(...untracked);
  }

  const clean = !staged.length && !unstaged.length && !untracked.length &&
    !unmerged.size;
  if (clean) lines.push("nothing to commit, working tree clean");

  return ok(lines.join("\n") + "\n");
}

function cmdLog(state: GitState, args: string[]): CmdResult {
  const oneline = takeFlag(args, "--oneline");
  const graph = takeFlag(args, "--graph");
  const head = resolveHead(state);
  if (!head) {
    return fail("fatal: your current branch does not have any commits yet");
  }
  const rangeTok = args.find((a) => a.includes(".."));
  let commits: ReturnType<typeof asCommit>[];
  if (rangeTok) {
    commits = logRangeCommits(state, rangeTok);
  } else {
    const start = args[0] ? resolveRevision(state, args[0]) : head;
    commits = walkLog(state, [start], new Set());
  }
  const bodies = oneline
    ? commits.map((c) => `${c.id.slice(0, 7)} ${c.message.split("\n")[0]}`)
    : commits.map((c) =>
      [
        `commit ${c.id}`,
        `Author: ${c.author}`,
        "",
        `    ${c.message.split("\n").join("\n    ")}`,
        "",
      ].join("\n")
    );
  if (!graph) {
    if (oneline) {
      return ok(bodies.join("\n") + (bodies.length ? "\n" : ""));
    }
    return ok(bodies.join("\n"));
  }
  const prefixes = graphPrefixes(commits);
  const lines: string[] = [];
  for (let i = 0; i < commits.length; i++) {
    const prefix = prefixes[i] ?? "*";
    if (oneline) {
      lines.push(`${prefix} ${bodies[i]}`);
    } else {
      const chunk = bodies[i].split("\n");
      lines.push(`${prefix} ${chunk[0]}`);
      for (const extra of chunk.slice(1)) {
        lines.push(`${" ".repeat(prefix.length)} ${extra}`);
      }
    }
  }
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}

function walkLog(
  state: GitState,
  starts: string[],
  exclude: Set<string>,
): ReturnType<typeof asCommit>[] {
  const commits: ReturnType<typeof asCommit>[] = [];
  const seen = new Set<string>();
  const stack = [...starts];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || exclude.has(id)) continue;
    seen.add(id);
    const c = asCommit(state, id);
    commits.push(c);
    for (const p of [...c.parents].reverse()) stack.push(p);
  }
  return commits;
}

function parseDots(
  token: string,
): { a: string; b: string; symmetric: boolean } {
  const three = token.indexOf("...");
  if (three !== -1) {
    return {
      a: token.slice(0, three) || "HEAD",
      b: token.slice(three + 3) || "HEAD",
      symmetric: true,
    };
  }
  const two = token.indexOf("..");
  return {
    a: token.slice(0, two) || "HEAD",
    b: token.slice(two + 2) || "HEAD",
    symmetric: false,
  };
}

function logRangeCommits(
  state: GitState,
  token: string,
): ReturnType<typeof asCommit>[] {
  const { a, b, symmetric } = parseDots(token);
  const left = resolveRevision(state, a);
  const right = resolveRevision(state, b);
  if (symmetric) {
    const fromA = ancestorSet(state, left);
    const fromB = ancestorSet(state, right);
    const both = new Set([...fromA].filter((id) => fromB.has(id)));
    return walkLog(state, [left, right], both);
  }
  return walkLog(state, [right], ancestorSet(state, left));
}

/** Crude text DAG: `*` for the commit, `|` for other live lanes. */
function graphPrefixes(commits: ReturnType<typeof asCommit>[]): string[] {
  const listed = new Set(commits.map((c) => c.id));
  const lanes: (string | null)[] = [];
  const prefixes: string[] = [];
  for (const c of commits) {
    let col = lanes.indexOf(c.id);
    if (col === -1) {
      lanes.push(c.id);
      col = lanes.length - 1;
    }
    prefixes.push(
      lanes.map((id, i) => {
        if (i === col) return "*";
        if (id) return "|";
        return " ";
      }).join(" "),
    );
    const keep = c.parents.filter((p) => listed.has(p));
    const first = keep[0] ?? null;
    lanes[col] = first;
    for (const p of keep.slice(1)) {
      if (!lanes.includes(p)) lanes.push(p);
    }
    if (first) {
      const other = lanes.findIndex((id, i) => i !== col && id === first);
      if (other !== -1) lanes[col] = null;
    }
    while (lanes.length && lanes[lanes.length - 1] == null) lanes.pop();
  }
  return prefixes;
}

function cmdSwitch(state: GitState, args: string[]): CmdResult {
  const create = takeFlag(args, "-c") || takeFlag(args, "-C");
  const name = args[0];
  if (!name) return fail("fatal: missing branch name");
  if (create) return createAndSwitch(state, name);
  return switchBranch(state, name);
}

function cmdCheckout(state: GitState, args: string[]): CmdResult {
  const ours = takeFlag(args, "--ours");
  const theirs = takeFlag(args, "--theirs");
  const dash = args.indexOf("--");
  if (dash !== -1) args.splice(dash, 1);
  if (ours || theirs) {
    return checkoutStage(state, ours ? 2 : 3, args);
  }
  const create = takeFlag(args, "-b") || takeFlag(args, "-B");
  const name = args[0];
  if (!name) return fail("fatal: missing branch name");
  if (create) return createAndSwitch(state, name);
  return switchBranch(state, name);
}

function checkoutStage(
  state: GitState,
  stage: 2 | 3,
  paths: string[],
): CmdResult {
  const wt = activeWorktree(state);
  const unmerged = [
    ...new Set(
      wt.index.filter((e) => e.stage !== 0).map((e) => e.path),
    ),
  ];
  if (!unmerged.length) {
    return fail("error: pathspec did not match any unmerged files");
  }
  const targets = paths.length ? paths : unmerged;
  for (const path of targets) {
    const entry = wt.index.find((e) => e.path === path && e.stage === stage);
    if (!entry) {
      return fail(`error: '${path}' is not unmerged with stage ${stage}`);
    }
    const blob = state.objects[entry.blob];
    if (blob?.type === "blob") wt.files[path] = blob.content;
  }
  const label = stage === 2 ? "ours" : "theirs";
  return ok(`Updated ${targets.length} path(s) from --${label}\n`);
}

function cmdEdit(state: GitState, args: string[]): CmdResult {
  const path = args[0];
  if (!path) return fail("usage: edit <path> [<<] <contents>");
  let parts = args.slice(1);
  if (parts[0] === "<<") parts = parts.slice(1);
  if (!parts.length) return fail("edit: missing contents");
  let content = parts.join(" ").replace(/\\n/g, "\n");
  if (!content.endsWith("\n")) content += "\n";
  activeWorktree(state).files[path] = content;
  return ok();
}

function trackingRefsNamed(state: GitState, branch: string): string[] {
  const out: string[] = [];
  for (const name of Object.keys(state.refs)) {
    const m = name.match(/^refs\/remotes\/([^/]+)\/(.+)$/);
    if (m && m[2] === branch) out.push(name);
  }
  return out;
}

function checkoutTracking(
  state: GitState,
  name: string,
  tracking: string,
): CmdResult {
  const id = state.refs[tracking];
  if (!id) return fail(`fatal: invalid reference: ${tracking}`);
  const localRef = `refs/heads/${name}`;
  const from = state.refs[localRef] ?? null;
  state.refs[localRef] = id;
  emit(state, "ref-move", { ref: localRef, from, to: id });
  const wt = activeWorktree(state);
  const oldHead = resolveHead(state);
  const oldBranch = wt.branch ?? "HEAD";
  checkoutCommit(state, id);
  wt.branch = name;
  wt.head = id;
  if (wt.id === state.activeWorktree) state.HEAD = localRef;
  appendReflog(
    state,
    oldHead,
    id,
    `checkout: moving from ${oldBranch} to ${name}`,
  );
  const remoteLabel = tracking.slice("refs/remotes/".length);
  return ok(
    `Branch '${name}' set up to track remote branch '${remoteLabel}'.\nSwitched to a new branch '${name}'\n`,
  );
}

function createAndSwitch(state: GitState, name: string): CmdResult {
  if (state.refs[`refs/heads/${name}`]) {
    return fail(`fatal: a branch named '${name}' already exists`);
  }
  const head = resolveHead(state);
  if (!head) return fail("fatal: not a valid object name: HEAD");
  state.refs[`refs/heads/${name}`] = head;
  return switchBranch(state, name);
}

function switchBranch(state: GitState, name: string): CmdResult {
  const branchExists = Boolean(state.refs[`refs/heads/${name}`]);
  if (!branchExists) {
    const matches = trackingRefsNamed(state, name);
    if (matches.length === 1) return checkoutTracking(state, name, matches[0]);
    if (matches.length > 1) {
      return fail(
        `fatal: '${name}' is ambiguous among remote-tracking branches`,
      );
    }
  }
  const id = lookupRef(state, name);
  if (!id) return fail(`fatal: invalid reference: ${name}`);
  const wt = activeWorktree(state);
  if (branchExists) {
    const taken = branchCheckedOut(state, name);
    if (taken && taken !== wt.path) {
      return fail(`fatal: '${name}' is already checked out at '${taken}'`);
    }
  }
  const obj = state.objects[id];
  const commitId = obj?.type === "commit" ? id : resolveRevision(state, name);
  const oldHead = resolveHead(state);
  const oldBranch = wt.branch ?? "HEAD";
  checkoutCommit(state, commitId);
  if (branchExists) {
    wt.branch = name;
    wt.head = commitId;
    if (wt.id === state.activeWorktree) state.HEAD = `refs/heads/${name}`;
  } else {
    wt.branch = null;
    wt.head = commitId;
    if (wt.id === state.activeWorktree) state.HEAD = commitId;
  }
  appendReflog(
    state,
    oldHead,
    commitId,
    `checkout: moving from ${oldBranch} to ${name}`,
  );
  const label = branchExists ? `branch '${name}'` : name;
  return ok(`Switched to ${label}\n`);
}

function cmdBranch(state: GitState, args: string[]): CmdResult {
  const del = takeFlag(args, "-d") || takeFlag(args, "-D");
  const name = args[0];
  if (del) {
    if (!name) return fail("fatal: branch name required");
    if (currentBranch(state) === name) {
      return fail(`error: cannot delete branch '${name}' checked out`);
    }
    const taken = branchCheckedOut(state, name);
    if (taken) {
      return fail(
        `error: cannot delete branch '${name}' used by worktree at '${taken}'`,
      );
    }
    if (!state.refs[`refs/heads/${name}`]) {
      return fail(`error: branch '${name}' not found`);
    }
    delete state.refs[`refs/heads/${name}`];
    return ok(`Deleted branch ${name}\n`);
  }
  if (name) {
    if (state.refs[`refs/heads/${name}`]) {
      return fail(`fatal: a branch named '${name}' already exists`);
    }
    const head = resolveHead(state);
    if (!head) return fail("fatal: not a valid object name: HEAD");
    state.refs[`refs/heads/${name}`] = head;
    return ok();
  }
  const current = currentBranch(state);
  const names = Object.keys(state.refs)
    .filter((r) => r.startsWith("refs/heads/"))
    .map((r) => r.slice("refs/heads/".length))
    .sort();
  const lines = names.map((n) => (n === current ? "* " : "  ") + n);
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}

function cmdAdd(state: GitState, args: string[]): CmdResult {
  if (!args.length) return fail("fatal: pathspec required");
  const wt = activeWorktree(state);
  const paths = args.includes(".") || args.includes("-A")
    ? [...new Set([...Object.keys(wt.files), ...wt.index.map((e) => e.path)])]
    : args;
  for (const path of paths) {
    if (path === "." || path === "-A") continue;
    wt.index = wt.index.filter((e) => e.path !== path);
    if (path in wt.files) {
      const blob = storeBlob(state, wt.files[path]);
      wt.index.push({ path, blob, stage: 0 });
    }
  }
  wt.index.sort((a, b) => a.path.localeCompare(b.path) || a.stage - b.stage);
  updateConflicted(state);
  return ok();
}

function cmdCommit(state: GitState, args: string[]): CmdResult {
  const amend = takeFlag(args, "--amend");
  const noEdit = takeFlag(args, "--no-edit");
  const message = takeOption(args, "-m") ?? takeOption(args, "--message");
  const wt = activeWorktree(state);
  const head = resolveHead(state);

  if (hasUnmerged(state)) {
    return fail(
      "error: Committing is not possible because you have unmerged files.",
    );
  }

  if (amend) {
    if (!head) return fail("fatal: no commits yet to amend");
    const current = asCommit(state, head);
    const msg = noEdit ? current.message : (message ?? current.message);
    if (!noEdit && !message) {
      return fail("fatal: need -m or --no-edit to amend");
    }
    const id = createCommitFromIndex(
      state,
      msg,
      current.parents,
      `commit (amend): ${msg.split("\n")[0]}`,
    );
    return ok(
      `[${wt.branch ?? "HEAD"} ${id.slice(0, 7)}] ${msg.split("\n")[0]}\n`,
    );
  }

  const mergeHead = state.refs["MERGE_HEAD"];
  if (!message && !mergeHead && !state.cherryPickHead) {
    return fail('fatal: need git commit -m "message"');
  }

  if (mergeHead) {
    const theirsName = nameForCommit(state, mergeHead);
    const msg = message ?? `Merge branch '${theirsName}'`;
    const parents = head ? [head, mergeHead] : [mergeHead];
    const id = createCommitFromIndex(
      state,
      msg,
      parents,
      `commit (merge): ${msg.split("\n")[0]}`,
    );
    emit(state, "merge-commit", { id, parents });
    delete state.refs["MERGE_HEAD"];
    return ok(`[${wt.branch ?? "HEAD"} ${id.slice(0, 7)}] ${msg}\n`);
  }

  if (state.cherryPickHead && !state.rebaseTodos.length) {
    const picked = asCommit(state, state.cherryPickHead);
    const msg = message ?? picked.message;
    const parents = head ? [head] : [];
    const id = createCommitFromIndex(
      state,
      msg,
      parents,
      `commit: ${msg.split("\n")[0]}`,
    );
    state.cherryPickHead = null;
    return ok(
      `[${wt.branch ?? "HEAD"} ${id.slice(0, 7)}] ${msg.split("\n")[0]}\n`,
    );
  }

  const parents = head ? [head] : [];
  const id = createCommitFromIndex(
    state,
    message!,
    parents,
    `commit: ${message!.split("\n")[0]}`,
  );
  return ok(
    `[${wt.branch ?? "HEAD"} ${id.slice(0, 7)}] ${message!.split("\n")[0]}\n`,
  );
}

function cmdReset(state: GitState, args: string[]): CmdResult {
  if (takeFlag(args, "--merge")) {
    const head = resolveHead(state);
    if (!state.refs["MERGE_HEAD"] && !state.conflicted && !head) {
      return fail("fatal: There is no merge to abort");
    }
    if (!state.refs["MERGE_HEAD"] && !state.conflicted) {
      return fail("fatal: There is no merge to abort");
    }
    if (head) checkoutCommit(state, head);
    delete state.refs["MERGE_HEAD"];
    state.conflicted = false;
    return ok();
  }
  let mode: "soft" | "mixed" | "hard" = "mixed";
  if (takeFlag(args, "--soft")) mode = "soft";
  else if (takeFlag(args, "--mixed")) mode = "mixed";
  else if (takeFlag(args, "--hard")) mode = "hard";
  const target = args[0] ?? "HEAD";
  const id = resolveRevision(state, target);
  resetTo(state, id, mode);
  return ok();
}

function cmdReflog(state: GitState): CmdResult {
  const lines = state.reflog.map((e, i) => {
    const id = (e.newId ?? "0000000").slice(0, 7);
    return `${id} HEAD@{${i}}: ${e.message}`;
  });
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}

function cmdRemote(state: GitState, args: string[]): CmdResult {
  const sub = args[0];
  if (sub === "add") {
    const name = args[1];
    if (!name) return fail("usage: git remote add <name> [<url>]");
    if (state.remotes[name]) {
      return fail(`fatal: remote ${name} already exists`);
    }
    state.remotes[name] = { name, objects: {}, refs: {} };
    return ok();
  }
  if (!sub || sub === "-v" || sub === "show") {
    const names = Object.keys(state.remotes).sort();
    return ok(names.join("\n") + (names.length ? "\n" : ""));
  }
  return fail(`fatal: unknown subcommand ${sub}`);
}

function cmdFetch(state: GitState, args: string[]): CmdResult {
  const remoteName = args[0] ?? "origin";
  copyRemoteObjects(state, remoteName);
  const remote = state.remotes[remoteName];
  const tips = Object.entries(remote.refs)
    .filter(([r]) => r.startsWith("refs/heads/"))
    .map(([r, id]) =>
      ` * [fetch] ${r.slice("refs/heads/".length)} -> ${remoteName}/${
        r.slice("refs/heads/".length)
      } ${id.slice(0, 7)}`
    );
  return ok(
    `From ${remoteName}\n${tips.join("\n")}${tips.length ? "\n" : ""}`,
  );
}

function trackingRef(remoteName: string, branch: string): string {
  return `refs/remotes/${remoteName}/${branch}`;
}

function cmdPull(state: GitState, args: string[]): CmdResult {
  const ffOnly = takeFlag(args, "--ff-only");
  const rebase = takeFlag(args, "--rebase");
  const remoteName = args[0] ?? "origin";
  const branch = args[1] ?? currentBranch(state) ?? "main";
  const fetched = cmdFetch(state, [remoteName]);
  if (!fetched.ok) return fetched;
  const theirs = state.refs[trackingRef(remoteName, branch)];
  if (!theirs) {
    return fail(`fatal: couldn't find remote ref ${branch} on ${remoteName}`);
  }
  if (rebase) return rebaseOnto(state, theirs, `${remoteName}/${branch}`);
  return mergeCommitish(state, theirs, `${remoteName}/${branch}`, {
    ffOnly,
    noFf: false,
  });
}

function cmdMerge(state: GitState, args: string[]): CmdResult {
  if (takeFlag(args, "--abort")) return mergeAbort(state);
  const noFf = takeFlag(args, "--no-ff");
  const ffOnly = takeFlag(args, "--ff-only");
  const name = args[0];
  if (!name) return fail("fatal: merge requires a branch or commit");
  const theirs = resolveRevision(state, name);
  return mergeCommitish(state, theirs, name, { noFf, ffOnly });
}

function mergeAbort(state: GitState): CmdResult {
  if (!state.refs["MERGE_HEAD"] && !state.conflicted) {
    return fail("fatal: There is no merge to abort");
  }
  const head = resolveHead(state);
  if (head) checkoutCommit(state, head);
  delete state.refs["MERGE_HEAD"];
  state.conflicted = false;
  return ok("Merge aborted\n");
}

function mergeCommitish(
  state: GitState,
  theirs: string,
  label: string,
  opts: { noFf: boolean; ffOnly: boolean },
): CmdResult {
  const ours = resolveHead(state);
  if (!ours) return fail("fatal: not a valid object name: HEAD");
  if (theirs === ours) return ok("Already up to date.\n");
  if (worktreeIsDirty(state)) {
    return fail(
      "error: Your local changes to the following files would be overwritten by merge",
    );
  }
  if (isAncestor(state, theirs, ours)) {
    return ok("Already up to date.\n");
  }
  if (isAncestor(state, ours, theirs) && !opts.noFf) {
    checkoutCommit(state, theirs);
    moveHead(state, theirs, `merge ${label}: Fast-forward`);
    emit(state, "fast-forward", { from: ours, to: theirs });
    return ok(
      `Updating ${ours.slice(0, 7)}..${theirs.slice(0, 7)}\nFast-forward\n`,
    );
  }
  if (opts.ffOnly) {
    return fail("fatal: Not possible to fast-forward, aborting.");
  }

  const base = mergeBase(state, ours, theirs);
  const baseFiles = base ? commitFiles(state, base) : {};
  const result = threeWayMerge(
    state,
    baseFiles,
    commitFiles(state, ours),
    commitFiles(state, theirs),
    label,
  );
  applyMergeToWorktree(state, result);
  if (result.conflicted) {
    state.refs["MERGE_HEAD"] = theirs;
    const list = result.conflicts.map((p) =>
      `CONFLICT (content): Merge conflict in ${p}`
    );
    return {
      ok: false,
      stdout: "",
      stderr: `Auto-merging failed\n${
        list.join("\n")
      }\nAutomatic merge failed; fix conflicts and then commit the result.\n`,
    };
  }
  const msg = label.includes("/")
    ? `Merge remote-tracking branch '${label}'`
    : `Merge branch '${label}'`;
  const id = createCommitFromIndex(
    state,
    msg,
    [ours, theirs],
    `merge ${label}`,
  );
  emit(state, "merge-commit", { id, parents: [ours, theirs] });
  return ok(`Merge made by the 'ort' strategy.\n[${id.slice(0, 7)}] ${msg}\n`);
}

function cmdRebase(state: GitState, args: string[]): CmdResult {
  if (takeFlag(args, "--abort")) return rebaseAbort(state);
  if (takeFlag(args, "--continue")) return rebaseContinue(state);
  if (takeFlag(args, "--skip")) return rebaseSkip(state);
  const interactive = takeFlag(args, "-i") || takeFlag(args, "--interactive");
  const ontoName = args[0];
  if (!ontoName) return fail("fatal: rebase requires an upstream");
  const onto = resolveRevision(state, ontoName);
  if (interactive) return rebaseInteractive(state, onto, ontoName);
  return rebaseOnto(state, onto, ontoName);
}

type RebaseAction = "pick" | "squash" | "drop";

function parseTodoLine(
  line: string,
): { action: RebaseAction; rev: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const m = trimmed.match(/^(pick|p|squash|s|fixup|f|drop|d)\s+(\S+)/i);
  if (m) {
    const verb = m[1].toLowerCase();
    const action: RebaseAction = verb === "drop" || verb === "d"
      ? "drop"
      : verb === "squash" || verb === "s" || verb === "fixup" || verb === "f"
      ? "squash"
      : "pick";
    return { action, rev: m[2] };
  }
  if (/^[0-9a-f]{4,40}$/i.test(trimmed.split(/\s/)[0])) {
    return { action: "pick", rev: trimmed.split(/\s/)[0] };
  }
  return null;
}

function rebaseInteractive(
  state: GitState,
  onto: string,
  ontoName: string,
): CmdResult {
  const head = resolveHead(state);
  if (!head) return fail("fatal: no HEAD");
  if (worktreeIsDirty(state)) {
    return fail("error: cannot rebase: You have unstaged changes.");
  }
  const unique = uniqueCommits(state, head, onto);
  if (
    !unique.length && state.rebaseTodos.every((line) => !parseTodoLine(line))
  ) {
    if (isAncestor(state, head, onto)) {
      checkoutCommit(state, onto);
      moveHead(state, onto, `rebase: fast-forward to ${ontoName}`);
      emit(state, "fast-forward", { from: head, to: onto });
      return ok(`Fast-forwarded to ${ontoName}\n`);
    }
    return ok("Current branch is up to date.\n");
  }
  const preset = state.rebaseTodos.map(parseTodoLine);
  const usePreset = preset.length > 0 && preset.every((p) => p !== null);
  const plan = usePreset
    ? (preset as { action: RebaseAction; rev: string }[])
    : unique.map((id) => ({ action: "pick" as const, rev: id }));
  const resolved: { action: RebaseAction; id: string }[] = [];
  for (const step of plan) {
    if (step.action === "drop") {
      const dropped = lookupRef(state, step.rev);
      resolved.push({ action: "drop", id: dropped ?? step.rev });
      continue;
    }
    resolved.push({
      action: step.action,
      id: resolveRevision(state, step.rev),
    });
  }
  const printed = resolved.map((step) => {
    const obj = state.objects[step.id];
    const msg = obj?.type === "commit" ? obj.message.split("\n")[0] : "";
    return `${step.action} ${step.id.slice(0, 7)} ${msg}`.trimEnd();
  });
  if (!resolved.length) {
    return ok(printed.join("\n") + (printed.length ? "\n" : "noop\n"));
  }
  state.refs["ORIG_HEAD"] = head;
  checkoutCommit(state, onto);
  moveHead(state, onto, `rebase: checkout ${ontoName}`);
  state.rebaseTodos = resolved.map((s) => `${s.action} ${s.id}`);
  const replayed = replayTodos(state);
  const body = printed.join("\n") + "\n" + replayed.stdout;
  return { ...replayed, stdout: body };
}

function rebaseOnto(
  state: GitState,
  onto: string,
  ontoName: string,
): CmdResult {
  const head = resolveHead(state);
  if (!head) return fail("fatal: no HEAD");
  if (worktreeIsDirty(state)) {
    return fail("error: cannot rebase: You have unstaged changes.");
  }
  if (head === onto) return ok("Current branch is up to date.\n");
  const todos = uniqueCommits(state, head, onto);
  if (!todos.length) {
    if (isAncestor(state, head, onto)) {
      checkoutCommit(state, onto);
      moveHead(state, onto, `rebase: fast-forward to ${ontoName}`);
      emit(state, "fast-forward", { from: head, to: onto });
      return ok(`Fast-forwarded to ${ontoName}\n`);
    }
    return ok("Current branch is up to date.\n");
  }
  state.refs["ORIG_HEAD"] = head;
  checkoutCommit(state, onto);
  moveHead(state, onto, `rebase: checkout ${ontoName}`);
  state.rebaseTodos = todos;
  return replayTodos(state);
}

function replayTodos(state: GitState): CmdResult {
  let picked = 0;
  while (state.rebaseTodos.length) {
    const raw = state.rebaseTodos[0];
    const parsed = parseTodoLine(raw);
    const action = parsed?.action ?? "pick";
    const id = parsed ? parsed.rev : raw;
    if (action === "drop") {
      state.rebaseTodos = state.rebaseTodos.slice(1);
      continue;
    }
    const commitId = /^[0-9a-f]{4,40}$/i.test(id)
      ? (lookupRef(state, id) ?? id)
      : resolveRevision(state, id);
    const squash = action === "squash" && picked > 0;
    const r = squash
      ? applySquash(state, commitId)
      : applyPick(state, commitId, true);
    if (!r.ok) {
      state.cherryPickHead = commitId;
      state.rebaseTodos = state.rebaseTodos.slice(1);
      return r;
    }
    state.rebaseTodos = state.rebaseTodos.slice(1);
    picked++;
  }
  state.cherryPickHead = null;
  delete state.refs["ORIG_HEAD"];
  return ok("Successfully rebased and updated.\n");
}

function rebaseContinue(state: GitState): CmdResult {
  if (!state.cherryPickHead && !state.rebaseTodos.length) {
    return fail("fatal: no rebase in progress");
  }
  if (hasUnmerged(state)) {
    return fail("error: fix conflicts and run git rebase --continue");
  }
  if (state.cherryPickHead) {
    const picked = asCommit(state, state.cherryPickHead);
    const head = resolveHead(state);
    createCommitFromIndex(
      state,
      picked.message,
      head ? [head] : [],
      `rebase: ${picked.message.split("\n")[0]}`,
    );
    state.cherryPickHead = null;
  }
  return replayTodos(state);
}

function rebaseSkip(state: GitState): CmdResult {
  if (!state.cherryPickHead && !state.rebaseTodos.length) {
    return fail("fatal: no rebase in progress");
  }
  const head = resolveHead(state);
  if (head) checkoutCommit(state, head);
  state.cherryPickHead = null;
  return replayTodos(state);
}

function rebaseAbort(state: GitState): CmdResult {
  const orig = state.refs["ORIG_HEAD"];
  if (!orig && !state.rebaseTodos.length && !state.cherryPickHead) {
    return fail("fatal: no rebase in progress");
  }
  if (orig) {
    checkoutCommit(state, orig);
    moveHead(state, orig, "rebase: abort");
  }
  state.rebaseTodos = [];
  state.cherryPickHead = null;
  delete state.refs["ORIG_HEAD"];
  return ok("Rebase aborted\n");
}

function applyPick(
  state: GitState,
  pickId: string,
  forRebase: boolean,
): CmdResult {
  const picked = asCommit(state, pickId);
  const ours = resolveHead(state);
  if (!ours) return fail("fatal: no HEAD");
  const baseId = picked.parents[0];
  const baseFiles = baseId ? commitFiles(state, baseId) : {};
  const result = threeWayMerge(
    state,
    baseFiles,
    commitFiles(state, ours),
    commitFiles(state, pickId),
    pickId.slice(0, 7),
  );
  applyMergeToWorktree(state, result);
  if (result.conflicted) {
    state.cherryPickHead = pickId;
    const kind = forRebase ? "rebase" : "cherry-pick";
    return {
      ok: false,
      stdout: "",
      stderr: `error: could not apply ${pickId.slice(0, 7)} ${
        picked.message.split("\n")[0]
      }\nfix conflicts and run git ${kind} --continue\n`,
    };
  }
  createCommitFromIndex(
    state,
    picked.message,
    [ours],
    `${forRebase ? "rebase" : "cherry-pick"}: ${picked.message.split("\n")[0]}`,
  );
  return ok();
}

function applySquash(state: GitState, pickId: string): CmdResult {
  const picked = asCommit(state, pickId);
  const ours = resolveHead(state);
  if (!ours) return fail("fatal: no HEAD");
  const baseId = picked.parents[0];
  const baseFiles = baseId ? commitFiles(state, baseId) : {};
  const result = threeWayMerge(
    state,
    baseFiles,
    commitFiles(state, ours),
    commitFiles(state, pickId),
    pickId.slice(0, 7),
  );
  applyMergeToWorktree(state, result);
  if (result.conflicted) {
    state.cherryPickHead = pickId;
    return {
      ok: false,
      stdout: "",
      stderr: `error: could not apply ${pickId.slice(0, 7)} ${
        picked.message.split("\n")[0]
      }\nfix conflicts and run git rebase --continue\n`,
    };
  }
  const current = asCommit(state, ours);
  const msg = `${current.message}\n\n${picked.message}`;
  createCommitFromIndex(
    state,
    msg,
    current.parents,
    `rebase: squash ${picked.message.split("\n")[0]}`,
  );
  return ok();
}

function cmdCherryPick(state: GitState, args: string[]): CmdResult {
  if (takeFlag(args, "--abort")) {
    const head = resolveHead(state);
    if (head) checkoutCommit(state, head);
    state.cherryPickHead = null;
    return ok("Cherry-pick aborted\n");
  }
  if (takeFlag(args, "--continue")) {
    if (!state.cherryPickHead) {
      return fail("fatal: no cherry-pick in progress");
    }
    if (hasUnmerged(state)) {
      return fail("error: fix conflicts and git add, then --continue");
    }
    const picked = asCommit(state, state.cherryPickHead);
    const head = resolveHead(state);
    createCommitFromIndex(
      state,
      picked.message,
      head ? [head] : [],
      `cherry-pick: ${picked.message.split("\n")[0]}`,
    );
    state.cherryPickHead = null;
    return ok();
  }
  const idArg = args[0];
  if (!idArg) return fail("fatal: cherry-pick requires a commit");
  if (worktreeIsDirty(state)) {
    return fail(
      "error: Your local changes would be overwritten by cherry-pick",
    );
  }
  const pickId = resolveRevision(state, idArg);
  return applyPick(state, pickId, false);
}

function cmdStash(state: GitState, args: string[]): CmdResult {
  const sub = args[0];
  if (!sub || sub === "push" || sub.startsWith("-")) {
    const rest = sub === "push" ? args.slice(1) : args;
    return stashPush(state, rest);
  }
  if (sub === "pop") return stashApply(state, args.slice(1), true);
  if (sub === "apply") return stashApply(state, args.slice(1), false);
  if (sub === "drop") return stashDrop(state, args.slice(1));
  if (sub === "branch") return stashBranch(state, args.slice(1));
  if (sub === "list") return stashList(state);
  return fail(`fatal: unknown stash subcommand ${sub}`);
}

function stashIndex(args: string[]): number {
  const raw = args[0];
  if (!raw) return 0;
  const m = raw.match(/^stash@\{(\d+)\}$/) ?? raw.match(/^(\d+)$/);
  return m ? Number(m[1]) : 0;
}

function stashPush(state: GitState, args: string[]): CmdResult {
  const includeUntracked = takeFlag(args, "-u") ||
    takeFlag(args, "--include-untracked");
  const msg = takeOption(args, "-m") ?? takeOption(args, "--message") ?? "";
  const wt = activeWorktree(state);
  const head = resolveHead(state);
  if (!head) return fail("fatal: no HEAD; cannot stash");
  const hFiles = commitFiles(state, head);
  const indexFiles: Record<string, string> = {};
  for (const e of wt.index) {
    if (e.stage !== 0) continue;
    const b = state.objects[e.blob];
    if (b?.type === "blob") indexFiles[e.path] = b.content;
  }
  const untrackedKeep: Record<string, string> = {};
  if (!includeUntracked) {
    for (const [p, content] of Object.entries(wt.files)) {
      const inHead = p in hFiles;
      const inIndex = wt.index.some((e) => e.path === p && e.stage === 0);
      if (!inHead && !inIndex) untrackedKeep[p] = content;
    }
  }
  const workFiles: Record<string, string> = {};
  for (const [p, content] of Object.entries(wt.files)) {
    const tracked = p in hFiles || wt.index.some((e) => e.path === p);
    if (includeUntracked || tracked) workFiles[p] = content;
  }
  const iTree = storeTree(state, indexFiles);
  const wTree = storeTree(state, workFiles);
  const branch = wt.branch ?? "HEAD";
  const iId = storeCommit(
    state,
    iTree,
    [head],
    `index on ${branch}: ${msg || head.slice(0, 7)}`,
  );
  const wMsg = `WIP on ${branch}: ${
    msg || asCommit(state, head).message.split("\n")[0]
  }`;
  const wId = storeCommit(state, wTree, [head, iId], wMsg);
  state.stash.unshift(wId);
  state.refs["refs/stash"] = wId;
  emit(state, "stash-w", { id: wId, parents: [head, iId] });
  checkoutCommit(state, head);
  if (!includeUntracked) Object.assign(wt.files, untrackedKeep);
  return ok(`Saved working directory and index state ${wMsg}\n`);
}

function stashApply(
  state: GitState,
  args: string[],
  dropOnSuccess: boolean,
): CmdResult {
  const idx = stashIndex(args);
  const wId = state.stash[idx];
  if (!wId) return fail("fatal: stash entry not found");
  const w = asCommit(state, wId);
  const h = w.parents[0];
  const i = w.parents[1];
  const ours = resolveHead(state);
  if (!ours) return fail("fatal: no HEAD");
  const baseFiles = h ? commitFiles(state, h) : {};
  const result = threeWayMerge(
    state,
    baseFiles,
    commitFiles(state, ours),
    commitFiles(state, wId),
    "Stashed changes",
  );
  applyMergeToWorktree(state, result);
  if (i && !result.conflicted && ours === h) {
    const wt = activeWorktree(state);
    wt.index = indexFromFiles(state, commitFiles(state, i));
    wt.files = commitFiles(state, wId);
    updateConflicted(state);
  }
  if (result.conflicted) {
    return {
      ok: false,
      stdout: "",
      stderr:
        "CONFLICT (content): Merge conflict in stash apply\nThe stash entry is kept in case you need it again.\n",
    };
  }
  if (dropOnSuccess) {
    state.stash.splice(idx, 1);
    if (state.stash[0]) state.refs["refs/stash"] = state.stash[0];
    else delete state.refs["refs/stash"];
  }
  return ok("Applied stash\n");
}

function stashDrop(state: GitState, args: string[]): CmdResult {
  const idx = stashIndex(args);
  if (!state.stash[idx]) return fail("fatal: stash entry not found");
  state.stash.splice(idx, 1);
  if (state.stash[0]) state.refs["refs/stash"] = state.stash[0];
  else delete state.refs["refs/stash"];
  return ok("Dropped stash\n");
}

function stashList(state: GitState): CmdResult {
  const lines = state.stash.map((id, i) => {
    const c = asCommit(state, id);
    return `stash@{${i}}: ${c.message.split("\n")[0]}`;
  });
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}

function stashBranch(state: GitState, args: string[]): CmdResult {
  const name = args[0];
  if (!name) return fail("fatal: git stash branch <name>");
  const idx = stashIndex(args.slice(1));
  const wId = state.stash[idx];
  if (!wId) return fail("fatal: stash entry not found");
  const w = asCommit(state, wId);
  const h = w.parents[0];
  if (!h) return fail("fatal: malformed stash");
  if (state.refs[`refs/heads/${name}`]) {
    return fail(`fatal: a branch named '${name}' already exists`);
  }
  state.refs[`refs/heads/${name}`] = h;
  const sw = switchBranch(state, name);
  if (!sw.ok) return sw;
  return stashApply(state, [String(idx)], true);
}

function cmdWorktree(state: GitState, args: string[]): CmdResult {
  const sub = args[0];
  if (sub === "add") return worktreeAdd(state, args.slice(1));
  if (sub === "list") return worktreeList(state);
  if (sub === "remove") return worktreeRemove(state, args.slice(1));
  return fail("usage: git worktree add|list|remove");
}

function worktreeAdd(state: GitState, args: string[]): CmdResult {
  const path = args[0];
  const branch = args[1];
  if (!path || !branch) {
    return fail("usage: git worktree add <path> <branch>");
  }
  const id = lookupRef(state, branch) ?? state.refs[`refs/heads/${branch}`];
  if (!id) return fail(`fatal: invalid reference: ${branch}`);
  const taken = branchCheckedOut(state, branch);
  if (taken) {
    return fail(`fatal: '${branch}' is already checked out at '${taken}'`);
  }
  if (state.worktrees.some((w) => w.path === path || w.id === path)) {
    return fail(`fatal: '${path}' already registered as a worktree`);
  }
  const files = commitFiles(state, id);
  state.worktrees.push({
    id: path,
    path,
    head: id,
    branch,
    index: indexFromFiles(state, files),
    files: { ...files },
  });
  // Bare repos have no primary checkout. Point activeWorktree at the new
  // linked tree so three-trees can show it (this VM has no cwd story).
  if (state.bare === true) {
    state.activeWorktree = path;
  }
  emit(state, "worktree-add", { path, branch });
  return ok(
    `Preparing worktree (checking out '${branch}')\nHEAD is now at ${
      id.slice(0, 7)
    }\n`,
  );
}

function worktreeList(state: GitState): CmdResult {
  const lines: string[] = [];
  if (state.bare === true) {
    const tip = resolveRepoHead(state);
    lines.push(`.  ${(tip ?? "").slice(0, 7)} (bare)`);
  }
  for (const w of state.worktrees) {
    const br = w.branch ? `[${w.branch}]` : "(detached)";
    lines.push(`${w.path}  ${(w.head ?? "").slice(0, 7)} ${br}`);
  }
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}

function worktreeRemove(state: GitState, args: string[]): CmdResult {
  const path = args[0];
  if (!path) return fail("usage: git worktree remove <path>");
  const i = state.worktrees.findIndex((w) => w.path === path || w.id === path);
  if (i === -1) return fail(`fatal: '${path}' is not a working tree`);
  if (state.worktrees[i].id === state.activeWorktree) {
    return fail("fatal: cannot remove the current worktree");
  }
  state.worktrees.splice(i, 1);
  return ok();
}

function cmdRevert(state: GitState, args: string[]): CmdResult {
  const idArg = args[0];
  if (!idArg) return fail("fatal: revert requires a commit");
  if (worktreeIsDirty(state)) {
    return fail("error: your local changes would be overwritten by revert");
  }
  const pickId = resolveRevision(state, idArg);
  const picked = asCommit(state, pickId);
  const ours = resolveHead(state);
  if (!ours) return fail("fatal: no HEAD");
  const parent = picked.parents[0];
  const result = threeWayMerge(
    state,
    commitFiles(state, pickId),
    commitFiles(state, ours),
    parent ? commitFiles(state, parent) : {},
    pickId.slice(0, 7),
  );
  applyMergeToWorktree(state, result);
  const msg = `Revert "${picked.message.split("\n")[0]}"`;
  if (result.conflicted) {
    return {
      ok: false,
      stdout: "",
      stderr: `error: could not revert ${pickId.slice(0, 7)}\n`,
    };
  }
  createCommitFromIndex(state, msg, [ours], `revert: ${msg}`);
  return ok(`[${currentBranch(state) ?? "HEAD"}] ${msg}\n`);
}

function cmdCatFile(state: GitState, args: string[]): CmdResult {
  takeFlag(args, "-p");
  const rev = args.find((a) => !a.startsWith("-"));
  if (!rev) return fail("fatal: git cat-file -p <id>");
  let id: string;
  if (rev.endsWith("^{tree}")) {
    const c = asCommit(state, resolveRevision(state, rev.slice(0, -7)));
    id = c.tree;
  } else {
    id = resolveRevision(state, rev);
  }
  return ok(prettyObject(state, id));
}

function cmdLsFiles(state: GitState, args: string[]): CmdResult {
  const unmerged = takeFlag(args, "-u") || takeFlag(args, "--unmerged");
  const wt = activeWorktree(state);
  const entries = unmerged
    ? wt.index.filter((e) => e.stage !== 0)
    : wt.index.filter((e) => e.stage === 0);
  const lines = entries.map((e) => {
    if (unmerged) return `100644 ${e.blob} ${e.stage}\t${e.path}`;
    return e.path;
  });
  return ok(lines.join("\n") + (lines.length ? "\n" : ""));
}
