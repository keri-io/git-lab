import { assert, assertEquals } from "@std/assert";
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

Deno.test("stash push writes W (parents H, I) with I parent H; stash[0] is latest", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const h = wt(vm).head!;
  write(vm, "README.md", "wip notes\n");
  const r = vm.exec('git stash push -m "parking"');
  assert(r.ok, r.stderr);
  assertEquals(vm.state.stash.length, 1);
  const wId = vm.state.stash[0];
  const w = commitOf(vm, wId);
  assertEquals(w.parents.length, 2);
  const [hParent, iId] = w.parents;
  assertEquals(hParent, h);
  const i = commitOf(vm, iId);
  assertEquals(i.parents, [h]);
  assertEquals(wt(vm).files["README.md"], "# demo\n");
  assert(r.events.some((e) => e.type === "stash-w"));
});

Deno.test("stash pop with conflict does not drop the stash; git stash drop removes it", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  write(vm, "README.md", "stashed edition\n");
  vm.exec("git stash push");
  assertEquals(vm.state.stash.length, 1);
  write(vm, "README.md", "committed edition\n");
  vm.exec("git add README.md");
  vm.exec('git commit -m "moved on"');
  const pop = vm.exec("git stash pop");
  assertEquals(pop.ok, false);
  assertEquals(vm.state.conflicted, true);
  assertEquals(vm.state.stash.length, 1, "pop must keep the stash on conflict");
  const dropped = vm.exec("git stash drop");
  assert(dropped.ok, dropped.stderr);
  assertEquals(vm.state.stash.length, 0);
});
