/**
 * Bare repos have HEAD + refs on GitState and no checkout at `.`.
 *
 * After `git worktree add` on a bare repo, GitVM sets `activeWorktree` to the
 * newly added linked worktree. The lab has no cwd story, so that is how
 * three-trees can show the checkout. Repo-level HEAD stays `refs/heads/main`.
 */
import { assert, assertEquals } from "@std/assert";
import {
  bareFromOrigin,
  emptyState,
  GitVM,
  originFixture,
} from "@/lib/git-vm/mod.ts";

Deno.test("non-bare emptyState still has one worktree at .", () => {
  const vm = new GitVM(emptyState());
  assertEquals(vm.state.bare, false);
  assertEquals(vm.snapshot().bare, false);
  assertEquals(vm.state.worktrees.length, 1);
  assertEquals(vm.state.worktrees[0].path, ".");
  assertEquals(vm.state.activeWorktree, "main");
});

Deno.test("missing GitState.bare is coerced to false", () => {
  const { bare: _omit, ...rest } = emptyState();
  const vm = new GitVM(rest as ReturnType<typeof emptyState>);
  assertEquals(vm.state.bare, false);
  assertEquals(vm.snapshot().bare, false);
});

Deno.test("bareFromOrigin has no checkout; status fails; log and fetch work", () => {
  const vm = new GitVM(bareFromOrigin());
  const snap = vm.snapshot();
  assertEquals(snap.bare, true);
  assertEquals(snap.worktrees.length, 0);
  assertEquals(vm.state.worktrees.length, 0);
  assertEquals(vm.state.HEAD, "refs/heads/main");
  assert(vm.state.refs["refs/heads/main"]);
  assertEquals(
    vm.state.refs["refs/remotes/origin/main"],
    vm.state.refs["refs/heads/main"],
  );

  const status = vm.exec("git status");
  assertEquals(status.ok, false);
  assert(status.stderr.includes("this operation must be run in a work tree"));

  const log = vm.exec("git log --oneline");
  assert(log.ok, log.stderr);
  assert(log.stdout.includes("initial"));

  const fetched = vm.exec("git fetch");
  assert(fetched.ok, fetched.stderr);

  const branch = vm.exec("git branch");
  assert(branch.ok, branch.stderr);
  assert(branch.stdout.includes("main"));

  const cat = vm.exec("git cat-file -p HEAD");
  assert(cat.ok, cat.stderr);
});

Deno.test("git worktree add on bare links a checkout; list shows . (bare)", () => {
  const { tip } = originFixture();
  const vm = new GitVM(bareFromOrigin());
  const added = vm.exec("git worktree add ../hotfix main");
  assert(added.ok, added.stderr);

  const listed = vm.exec("git worktree list");
  assert(listed.ok, listed.stderr);
  const lines = listed.stdout.trimEnd().split("\n");
  assertEquals(lines[0], `.  ${tip.slice(0, 7)} (bare)`);
  assert(lines[1].startsWith("../hotfix"));
  assert(lines[1].includes("[main]"));

  const snap = vm.snapshot();
  assertEquals(snap.bare, true);
  assertEquals(snap.worktrees.length, 1);
  assertEquals(snap.worktrees[0].path, "../hotfix");
  assertEquals(vm.state.worktrees.length, 1);
  assertEquals(vm.state.activeWorktree, "../hotfix");
  assertEquals(snap.files["README.md"], "# demo\n");

  const again = vm.exec("git worktree add ../hotfix-2 main");
  assertEquals(again.ok, false);
  assert(again.stderr.includes("already checked out"));
});

Deno.test("git init --bare then add/commit fail until worktree add", () => {
  const vm = new GitVM(emptyState());
  const inited = vm.exec("git init --bare");
  assert(inited.ok, inited.stderr);
  assertEquals(vm.state.bare, true);
  assertEquals(vm.state.worktrees.length, 0);
  assertEquals(vm.state.HEAD, "refs/heads/main");

  const add = vm.exec("git add README.md");
  assertEquals(add.ok, false);
  assert(add.stderr.includes("this operation must be run in a work tree"));

  const commit = vm.exec('git commit -m "nope"');
  assertEquals(commit.ok, false);
  assert(commit.stderr.includes("this operation must be run in a work tree"));

  const seeded = new GitVM(bareFromOrigin());
  assert(seeded.exec("git worktree add ../hotfix main").ok);
  const after = seeded.exec("git status");
  assert(after.ok, after.stderr);
});

Deno.test("git clone --bare copies origin objects without checkout", () => {
  const state = emptyState();
  const { remote, tip } = originFixture();
  state.remotes.origin = remote;
  const vm = new GitVM(state);
  const cloned = vm.exec("git clone --bare origin");
  assert(cloned.ok, cloned.stderr);
  assertEquals(vm.snapshot().bare, true);
  assertEquals(vm.state.worktrees.length, 0);
  assertEquals(vm.state.refs["refs/heads/main"], tip);
  assertEquals(vm.state.refs["refs/remotes/origin/main"], tip);
  assertEquals(vm.exec("git status").ok, false);
  assert(vm.exec("git log --oneline").ok);

  const missing = new GitVM(emptyState());
  const failed = missing.exec("git clone --bare origin");
  assertEquals(failed.ok, false);
  assert(failed.stderr.includes("does not exist"));
});
