import { assert, assertEquals } from "@std/assert";
import {
  activeWorktree,
  GitVM,
  seededLocalFromOrigin,
} from "@/lib/git-vm/mod.ts";

function write(vm: GitVM, path: string, content: string) {
  activeWorktree(vm.state).files[path] = content;
}

function wt(vm: GitVM) {
  return activeWorktree(vm.state);
}

Deno.test("git log --graph prints a text DAG with * markers", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "f\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "on feature"');
  vm.exec("git switch main");
  write(vm, "main.txt", "m\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "on main"');
  const merged = vm.exec("git merge --no-ff feature");
  assert(merged.ok, merged.stderr);
  const r = vm.exec("git log --graph --oneline");
  assert(r.ok, r.stderr);
  assert(r.stdout.includes("*"), r.stdout);
  assert(r.stdout.includes("|"), r.stdout);
  assert(r.stdout.includes("on feature"), r.stdout);
  assert(r.stdout.includes("on main"), r.stdout);
});

Deno.test("git log A..B is reachable from B excluding A", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "f\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "on feature"');
  const featureTip = wt(vm).head!;
  vm.exec("git switch main");
  write(vm, "main.txt", "m\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "on main"');
  const onlyFeature = vm.exec("git log --oneline main..feature");
  assert(onlyFeature.ok, onlyFeature.stderr);
  assert(onlyFeature.stdout.includes("on feature"));
  assert(!onlyFeature.stdout.includes("on main"));
  assert(onlyFeature.stdout.includes(featureTip.slice(0, 7)));
  const onlyMain = vm.exec("git log --oneline feature..main");
  assert(onlyMain.ok, onlyMain.stderr);
  assert(onlyMain.stdout.includes("on main"));
  assert(!onlyMain.stdout.includes("on feature"));
});

Deno.test("git log A...B is the symmetric difference", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  vm.exec("git switch -c feature");
  write(vm, "feat.txt", "f\n");
  vm.exec("git add feat.txt");
  vm.exec('git commit -m "on feature"');
  vm.exec("git switch main");
  write(vm, "main.txt", "m\n");
  vm.exec("git add main.txt");
  vm.exec('git commit -m "on main"');
  const r = vm.exec("git log --oneline main...feature");
  assert(r.ok, r.stderr);
  assert(r.stdout.includes("on feature"));
  assert(r.stdout.includes("on main"));
  assert(!r.stdout.includes("initial"));
});

Deno.test("status with no mutations returns an empty events array", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const r = vm.exec("git status");
  assert(r.ok, r.stderr);
  assertEquals(r.events, []);
});
