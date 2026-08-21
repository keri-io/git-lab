import { assert, assertEquals, assertNotEquals } from "@std/assert";
import {
  activeWorktree,
  GitVM,
  seededLocalFromOrigin,
} from "@/lib/git-vm/mod.ts";
import type { CommitObject } from "@/lib/git-vm/types.ts";

function wt(vm: GitVM) {
  return activeWorktree(vm.state);
}

function commitOf(vm: GitVM, id: string): CommitObject {
  const obj = vm.state.objects[id];
  assert(obj && obj.type === "commit");
  return obj;
}

Deno.test("cherry-pick copies the patch as a new hash", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.branch("feature").file("feat.txt", "picked\n").stage("feat.txt").commit(
    "add feat",
  );
  const original = wt(vm).head!;
  vm.onto("main").file("main.txt", "on main\n").stage("main.txt").commit(
    "main moves",
  );
  const mainBefore = wt(vm).head!;
  const r = vm.exec(`git cherry-pick ${original}`);
  assert(r.ok, r.stderr);
  const copy = wt(vm).head!;
  assertNotEquals(copy, original);
  assertEquals(commitOf(vm, copy).message, "add feat");
  assert(vm.state.objects[original]);
  assertEquals(wt(vm).files["feat.txt"], "picked\n");
  assertEquals(wt(vm).files["main.txt"], "on main\n");
  assertEquals(commitOf(vm, copy).parents, [mainBefore]);
});

Deno.test("rebase replays commits with new hashes", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.branch("feature").file("feat.txt", "feature work\n").stage("feat.txt")
    .commit("feat");
  const oldFeat = wt(vm).head!;
  vm.onto("main").file("main.txt", "main work\n").stage("main.txt").commit(
    "main work",
  );
  const mainTip = wt(vm).head!;
  vm.onto("feature");
  const r = vm.exec("git rebase main");
  assert(r.ok, r.stderr);
  const newFeat = wt(vm).head!;
  assertNotEquals(newFeat, oldFeat);
  assertEquals(commitOf(vm, newFeat).message, "feat");
  assertEquals(commitOf(vm, newFeat).parents, [mainTip]);
  assert(
    vm.state.objects[oldFeat],
    "original replayed commit stays in objects",
  );
  assertEquals(wt(vm).files["feat.txt"], "feature work\n");
  assertEquals(wt(vm).files["main.txt"], "main work\n");
});

Deno.test("rebase -i prints pick todos and still replays", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.branch("feature").file("feat.txt", "feature work\n").stage("feat.txt")
    .commit("feat")
    .onto("main").file("main.txt", "main work\n").stage("main.txt").commit(
      "main work",
    ).onto("feature");
  const r = vm.exec("git rebase -i main");
  assert(r.ok, r.stderr);
  assert(r.stdout.includes("pick"));
  assert(r.stdout.includes("feat"));
  assertEquals(commitOf(vm, wt(vm).head!).message, "feat");
  assertEquals(wt(vm).files["feat.txt"], "feature work\n");
  assertEquals(wt(vm).files["main.txt"], "main work\n");
});

Deno.test("rebase -i uses preset pick/squash/drop todos", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.branch("feature").file("a.txt", "a\n").stage("a.txt").commit("add a");
  const first = wt(vm).head!;
  vm.file("b.txt", "b\n").stage("b.txt").commit("add b");
  const second = wt(vm).head!;
  vm.onto("main").file("main.txt", "main work\n").stage("main.txt").commit(
    "main work",
  );
  const mainTip = wt(vm).head!;
  vm.onto("feature");
  vm.state.rebaseTodos = [`pick ${first}`, `squash ${second}`];
  const r = vm.exec("git rebase -i main");
  assert(r.ok, r.stderr);
  assert(r.stdout.includes("squash"));
  const tip = commitOf(vm, wt(vm).head!);
  assertEquals(tip.parents, [mainTip]);
  assert(tip.message.includes("add a"));
  assert(tip.message.includes("add b"));
  assertEquals(wt(vm).files["a.txt"], "a\n");
  assertEquals(wt(vm).files["b.txt"], "b\n");
});
