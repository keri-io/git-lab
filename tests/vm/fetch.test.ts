import { assert, assertEquals } from "@std/assert";
import {
  activeWorktree,
  emptyState,
  GitVM,
  makeCommit,
  originFixture,
  seededLocalFromOrigin,
} from "@/lib/git-vm/mod.ts";

function wt(vm: GitVM) {
  return activeWorktree(vm.state);
}

function advanceOrigin(
  vm: GitVM,
  message: string,
  files: Record<string, string>,
) {
  const remote = vm.state.remotes.origin;
  const parent = remote.refs["refs/heads/main"];
  const { commit: c, objects } = makeCommit(
    message,
    parent ? [parent] : [],
    files,
  );
  Object.assign(remote.objects, objects);
  remote.refs["refs/heads/main"] = c.id;
  return c.id;
}

Deno.test("fetch moves refs/remotes/origin/main without changing worktree files", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const localMain = vm.state.refs["refs/heads/main"];
  const filesBefore = { ...wt(vm).files };
  const remoteTip = advanceOrigin(vm, "remote work", {
    "README.md": "# demo\n",
    "remote.txt": "from origin\n",
  });
  const r = vm.exec("git fetch origin");
  assert(r.ok, r.stderr);
  assertEquals(vm.state.refs["refs/remotes/origin/main"], remoteTip);
  assertEquals(vm.state.refs["refs/heads/main"], localMain);
  assertEquals(wt(vm).files, filesBefore);
  assert(!("remote.txt" in wt(vm).files));
  assert(vm.state.objects[remoteTip]);
  assert(r.events.some((e) => e.type === "pack-arrival"));
  assert(r.events.some((e) => e.type === "ref-move"));
});

Deno.test("checkout main after fetch creates refs/heads/main tracking origin/main", () => {
  const state = emptyState();
  const { remote, tip } = originFixture();
  state.remotes.origin = remote;
  const vm = new GitVM(state);
  const fetched = vm.exec("git fetch origin");
  assert(fetched.ok, fetched.stderr);
  assertEquals(vm.state.refs["refs/heads/main"], undefined);
  assertEquals(vm.state.refs["refs/remotes/origin/main"], tip);
  const r = vm.exec("git checkout main");
  assert(r.ok, r.stderr);
  assertEquals(vm.state.refs["refs/heads/main"], tip);
  assertEquals(wt(vm).branch, "main");
  assertEquals(wt(vm).head, tip);
  assertEquals(wt(vm).files["README.md"], "# demo\n");
  assert(r.stdout.includes("set up to track"));
});

Deno.test("switch main after fetch also creates the unborn local branch", () => {
  const state = emptyState();
  const { remote, tip } = originFixture();
  state.remotes.origin = remote;
  const vm = new GitVM(state);
  assert(vm.exec("git fetch origin").ok);
  const r = vm.exec("git switch main");
  assert(r.ok, r.stderr);
  assertEquals(vm.state.refs["refs/heads/main"], tip);
  assertEquals(wt(vm).files["README.md"], "# demo\n");
});

Deno.test("pull --ff-only is fetch plus fast-forward merge", () => {
  const vm = new GitVM(seededLocalFromOrigin());
  const remoteTip = advanceOrigin(vm, "remote work", {
    "README.md": "# demo\n",
    "remote.txt": "from origin\n",
  });
  const r = vm.exec("git pull --ff-only origin main");
  assert(r.ok, r.stderr);
  assertEquals(vm.state.refs["refs/remotes/origin/main"], remoteTip);
  assertEquals(vm.state.refs["refs/heads/main"], remoteTip);
  assertEquals(wt(vm).head, remoteTip);
  assertEquals(wt(vm).files["remote.txt"], "from origin\n");
});
