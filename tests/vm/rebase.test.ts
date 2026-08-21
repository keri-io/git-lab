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

Deno.test("cherry-pick copies the patch as a new hash", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "picked\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "add feat"');
  const original = wt(vm).head!;
  vm.exec("git switch main");
  write(vm, "main.txt", "on main\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "main moves"');
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
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "feature work\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "feat"');
  const oldFeat = wt(vm).head!;
  vm.exec("git switch main");
  write(vm, "main.txt", "main work\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "main work"');
  const mainTip = wt(vm).head!;
  vm.exec("git switch feature");
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
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "feature work\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "feat"');
  vm.exec("git switch main");
  write(vm, "main.txt", "main work\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "main work"');
  vm.exec("git switch feature");
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
  vm.exec("git switch -c feature");
  write(vm, "a.txt", "a\n");
  vm.exec("git add a.txt");
  vm.exec('git commit -m "add a"');
  const first = wt(vm).head!;
  write(vm, "b.txt", "b\n");
  vm.exec("git add b.txt");
  vm.exec('git commit -m "add b"');
  const second = wt(vm).head!;
  vm.exec("git switch main");
  write(vm, "main.txt", "main work\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "main work"');
  const mainTip = wt(vm).head!;
  vm.exec("git switch feature");
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
