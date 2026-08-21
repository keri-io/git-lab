import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { activeWorktree, emptyState, GitVM } from "@/lib/git-vm/mod.ts";
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

Deno.test("emptyState + add + commit creates a commit; status is clean", () => {
  const vm = new GitVM(emptyState());
  write(vm, "hello.txt", "hi\n");
  const add = vm.exec("git add hello.txt");
  assert(add.ok, add.stderr);
  const committed = vm.exec('git commit -m "first"');
  assert(committed.ok, committed.stderr);
  const head = wt(vm).head;
  assert(head);
  assertEquals(vm.state.refs["refs/heads/main"], head);
  assertEquals(commitOf(vm, head).message, "first");
  const status = vm.exec("git status");
  assert(status.ok);
  assert(status.stdout.includes("working tree clean"));
  assertEquals(status.snapshot.conflicted, false);
});

Deno.test("amend creates a NEW commit id; old id stays in objects; branch points to new", () => {
  const vm = new GitVM(emptyState());
  write(vm, "a.txt", "one\n");
  vm.exec("git add a.txt");
  vm.exec('git commit -m "wip"');
  const oldId = wt(vm).head!;
  write(vm, "a.txt", "one\ntwo\n");
  vm.exec("git add a.txt");
  const amended = vm.exec("git commit --amend --no-edit");
  assert(amended.ok, amended.stderr);
  const newId = wt(vm).head!;
  assertNotEquals(newId, oldId);
  assert(
    vm.state.objects[oldId],
    "old commit must remain in the object database",
  );
  assertEquals(vm.state.refs["refs/heads/main"], newId);
  assertEquals(commitOf(vm, newId).parents, commitOf(vm, oldId).parents);
  assertEquals(commitOf(vm, newId).message, "wip");
  assert(amended.events.some((e) => e.type === "dangling"));
  assert(amended.events.some((e) => e.type === "ref-move"));
});

function twoCommits(): GitVM {
  const vm = new GitVM(emptyState());
  vm.file("a.txt", "v1\n").stage("a.txt").commit("first")
    .file("a.txt", "v2\n").stage("a.txt").commit("second");
  return vm;
}

Deno.test("reset --soft moves HEAD but leaves index and files at the undone commit", () => {
  const vm = twoCommits();
  const second = wt(vm).head!;
  const filesBefore = { ...wt(vm).files };
  const indexBefore = wt(vm).index.map((e) => ({ ...e }));
  const r = vm.exec("git reset --soft HEAD~1");
  assert(r.ok, r.stderr);
  assertEquals(commitOf(vm, wt(vm).head!).message, "first");
  assertNotEquals(wt(vm).head, second);
  assertEquals(wt(vm).files, filesBefore);
  assertEquals(wt(vm).index, indexBefore);
});

Deno.test("reset --mixed moves HEAD and index; files stay", () => {
  const vm = twoCommits();
  const filesBefore = { ...wt(vm).files };
  const r = vm.exec("git reset --mixed HEAD~1");
  assert(r.ok, r.stderr);
  assertEquals(commitOf(vm, wt(vm).head!).message, "first");
  assertEquals(wt(vm).files, filesBefore);
  assertEquals(wt(vm).files["a.txt"], "v2\n");
  const firstFiles = commitOf(vm, wt(vm).head!);
  const tree = vm.state.objects[firstFiles.tree];
  assert(tree && tree.type === "tree");
  const firstBlob = tree.entries.find((e) => e.name === "a.txt")?.id;
  assertEquals(wt(vm).index.find((e) => e.path === "a.txt")?.blob, firstBlob);
});

Deno.test("reset --hard moves HEAD, index, and files", () => {
  const vm = twoCommits();
  const r = vm.exec("git reset --hard HEAD~1");
  assert(r.ok, r.stderr);
  assertEquals(commitOf(vm, wt(vm).head!).message, "first");
  assertEquals(wt(vm).files["a.txt"], "v1\n");
  const first = commitOf(vm, wt(vm).head!);
  const tree = vm.state.objects[first.tree];
  assert(tree && tree.type === "tree");
  const firstBlob = tree.entries.find((e) => e.name === "a.txt")?.id;
  assertEquals(wt(vm).index.find((e) => e.path === "a.txt")?.blob, firstBlob);
});
