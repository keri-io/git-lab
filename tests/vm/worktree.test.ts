import { assert, assertEquals } from "@std/assert";
import {
  activeWorktree,
  GitVM,
  seededLocalFromOrigin,
} from "@/lib/git-vm/mod.ts";

function wt(vm: GitVM) {
  return activeWorktree(vm.state);
}

Deno.test("worktree add refuses if the branch is already checked out", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const refused = vm.exec("git worktree add ../other main");
  assertEquals(refused.ok, false);
  assert(refused.stderr.includes("already checked out"));
  assertEquals(vm.state.worktrees.length, 1);

  const branched = vm.exec("git branch hotfix");
  assert(branched.ok, branched.stderr);
  const added = vm.exec("git worktree add ../hotfix hotfix");
  assert(added.ok, added.stderr);
  assertEquals(vm.state.worktrees.length, 2);
  const extra = vm.state.worktrees.find((w) => w.path === "../hotfix");
  assert(extra);
  assertEquals(extra.branch, "hotfix");
  assertEquals(extra.head, wt(vm).head);
  assertEquals(extra.files["README.md"], "# demo\n");

  const again = vm.exec("git worktree add ../hotfix-2 hotfix");
  assertEquals(again.ok, false);
  assert(again.stderr.includes("already checked out"));
});

Deno.test("worktrees share objects and keep separate index/files", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git branch topic");
  vm.exec("git worktree add ../topic topic");
  const mainFiles = { ...wt(vm).files };
  const topic = vm.state.worktrees.find((w) => w.id === "../topic")!;
  topic.files["only-topic.txt"] = "isolated\n";
  assertEquals(wt(vm).files, mainFiles);
  assert(!("only-topic.txt" in wt(vm).files));
  assertEquals(topic.head, vm.state.refs["refs/heads/topic"]);
});

Deno.test("non-bare worktree list starts at . and is not (bare)", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const listed = vm.exec("git worktree list");
  assert(listed.ok, listed.stderr);
  assert(listed.stdout.startsWith(".  "));
  assert(!listed.stdout.includes("(bare)"));
  assertEquals(vm.snapshot().worktrees.length, 1);
});
