import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  activeWorktree,
  GitVM,
  seededLocalFromOrigin,
} from "@/lib/git-vm/mod.ts";
import type { CommitObject } from "@/lib/git-vm/types.ts";

function write(vm: GitVM, path: string, content: string) {
  activeWorktree(vm.state).files[path] = content;
}

function wt(vm: GitVM) {
  return activeWorktree(vm.state);
}

function commitOf(vm: GitVM, id: string): CommitObject {
  const obj = vm.state.objects[id];
  assert(obj && obj.type === "commit");
  return obj;
}

function divergeFeature(vm: GitVM) {
  const base = wt(vm).head!;
  vm.exec("git switch -c feature");
  write(vm, "README.md", "feature edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "on feature"');
  const featureTip = wt(vm).head!;
  vm.exec("git switch main");
  return { base, featureTip };
}

Deno.test("merge fast-forwards when HEAD is an ancestor", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const { featureTip } = divergeFeature(vm);
  const beforeCount =
    Object.values(vm.state.objects).filter((o) => o.type === "commit").length;
  const r = vm.exec("git merge feature");
  assert(r.ok, r.stderr);
  assert(r.stdout.includes("Fast-forward"));
  assertEquals(wt(vm).head, featureTip);
  assertEquals(commitOf(vm, wt(vm).head!).parents.length, 1);
  const afterCount =
    Object.values(vm.state.objects).filter((o) => o.type === "commit").length;
  assertEquals(afterCount, beforeCount);
  assertEquals(wt(vm).files["README.md"], "feature edition\n");
  assert(r.events.some((e) => e.type === "fast-forward"));
});

Deno.test("merge --no-ff creates a two-parent commit even when fast-forward is possible", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const { featureTip } = divergeFeature(vm);
  const mainBefore = wt(vm).head!;
  const r = vm.exec("git merge --no-ff feature");
  assert(r.ok, r.stderr);
  const head = wt(vm).head!;
  assertNotEquals(head, featureTip);
  assertEquals(commitOf(vm, head).parents, [mainBefore, featureTip]);
  assert(r.events.some((e) => e.type === "merge-commit"));
});

Deno.test("overlapping edits conflict with index stages 1/2/3; git add collapses to stage 0", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "README.md", "feature edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "on feature"');
  vm.exec("git switch main");
  write(vm, "README.md", "main edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "on main"');
  const r = vm.exec("git merge feature");
  assertEquals(r.ok, false);
  assertEquals(vm.state.conflicted, true);
  assertEquals(r.snapshot.conflicted, true);
  const stages = wt(vm).index.filter((e) => e.path === "README.md");
  assertEquals(stages.map((e) => e.stage).sort(), [1, 2, 3]);
  const ls = vm.exec("git ls-files -u");
  assert(ls.stdout.includes("1\tREADME.md"));
  assert(ls.stdout.includes("2\tREADME.md"));
  assert(ls.stdout.includes("3\tREADME.md"));
  assert(wt(vm).files["README.md"].includes("<<<<<<< HEAD"));
  assert(wt(vm).files["README.md"].includes("main edition"));
  assert(wt(vm).files["README.md"].includes("feature edition"));
  assert(wt(vm).files["README.md"].includes(">>>>>>> feature"));
  write(vm, "README.md", "resolved\n");
  const add = vm.exec("git add README.md");
  assert(add.ok, add.stderr);
  const after = wt(vm).index.filter((e) => e.path === "README.md");
  assertEquals(after.length, 1);
  assertEquals(after[0].stage, 0);
  assertEquals(vm.state.conflicted, false);
});

function conflictedVm(): GitVM {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "README.md", "feature edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "on feature"');
  vm.exec("git switch main");
  write(vm, "README.md", "main edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "on main"');
  const r = vm.exec("git merge feature");
  assertEquals(r.ok, false);
  assert(r.events.some((e) => e.type === "index-stages"));
  return vm;
}

Deno.test("git checkout --ours/--theirs writes that stage without collapsing the index", () => {
  const vm = conflictedVm();
  const ours = vm.exec("git checkout --ours -- README.md");
  assert(ours.ok, ours.stderr);
  assertEquals(wt(vm).files["README.md"], "main edition\n");
  assertEquals(
    wt(vm).index.filter((e) => e.path === "README.md").map((e) => e.stage)
      .sort(),
    [1, 2, 3],
  );
  const theirs = vm.exec("git checkout --theirs -- README.md");
  assert(theirs.ok, theirs.stderr);
  assertEquals(wt(vm).files["README.md"], "feature edition\n");
  assertEquals(vm.state.conflicted, true);
});

Deno.test("edit writes worktree contents so a learner can resolve conflicts", () => {
  const vm = conflictedVm();
  const edited = vm.exec("edit README.md << resolved together");
  assert(edited.ok, edited.stderr);
  assertEquals(wt(vm).files["README.md"], "resolved together\n");
  const add = vm.exec("git add README.md");
  assert(add.ok, add.stderr);
  assertEquals(wt(vm).index.filter((e) => e.path === "README.md")[0]?.stage, 0);
  assertEquals(vm.state.conflicted, false);
});

Deno.test("git reset --merge aborts a conflicted merge and keeps HEAD", () => {
  const vm = conflictedVm();
  const head = wt(vm).head;
  const r = vm.exec("git reset --merge");
  assert(r.ok, r.stderr);
  assertEquals(vm.state.conflicted, false);
  assertEquals(wt(vm).head, head);
  assertEquals(wt(vm).files["README.md"], "main edition\n");
  assertEquals(vm.state.refs["MERGE_HEAD"], undefined);
});
