import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { hashContent, hashObject } from "@/lib/git-vm/hash.ts";
import { activeWorktree, GitVM } from "@/lib/git-vm/mod.ts";

const HEX40 = /^[0-9a-f]{40}$/;

Deno.test("hashContent is 40 distinct hex chars, deterministic, not a repeated 16-char block", () => {
  const a = hashContent("blob 6\0# demo");
  const again = hashContent("blob 6\0# demo");
  const b = hashContent("blob 7\0# other");
  assertEquals(a, again);
  assertNotEquals(a, b);
  for (const id of [a, b, hashObject("tree", "100644 README.md abc")]) {
    assertEquals(id.length, 40);
    assert(HEX40.test(id), id);
    assert(
      id.slice(0, 16) !== id.slice(16, 32),
      `repeated 16-char block: ${id}`,
    );
  }
});

Deno.test("cat-file tree ids are 40 hex chars, not a repeated 16-char block", () => {
  const vm = new GitVM();
  activeWorktree(vm.state).files["README.md"] = "# demo\n";
  assert(vm.exec("git add README.md").ok);
  assert(vm.exec('git commit -m "initial"').ok);
  const printed = vm.exec("git cat-file -p HEAD^{tree}");
  assert(printed.ok, printed.stderr);
  const ids = [...printed.stdout.matchAll(/\b([0-9a-f]+)\b/g)].map((m) => m[1])
    .filter((id) => id.length >= 16);
  assert(ids.length >= 1, printed.stdout);
  for (const id of ids) {
    assertEquals(id.length, 40, printed.stdout);
    assert(HEX40.test(id), id);
    assert(id.slice(0, 16) !== id.slice(16, 32), id);
  }
});
