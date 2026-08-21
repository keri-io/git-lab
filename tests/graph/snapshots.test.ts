import { assert, assertEquals } from "@std/assert";
import { getLesson } from "@/lib/curriculum/mod.ts";
import { GitVM } from "@/lib/git-vm/mod.ts";
import { needsVisOverlay } from "@/lib/graph/render.ts";
import { stringifySnapshot } from "@/lib/graph/serialize.ts";

const HEX40 = /^[0-9a-f]{40}$/;

function afterDemo(slug: string) {
  const lesson = getLesson(slug);
  if (!lesson) throw new Error(`missing lesson ${slug}`);
  const vm = new GitVM(lesson.startState);
  for (const line of lesson.demoScript) {
    const r = vm.exec(line);
    if (!r.ok) throw new Error(`${slug}: ${line}\n${r.stderr}`);
  }
  return { lesson, vm, snapshot: vm.snapshot() };
}

function assertFortyHex(id: string, label: string) {
  assertEquals(id.length, 40, `${label} length ${id}`);
  assert(HEX40.test(id), `${label} not 40 hex: ${id}`);
  assert(
    id.slice(0, 16) !== id.slice(16, 32),
    `${label} repeated 16-char block: ${id}`,
  );
}

for (const slug of ["model", "fetch", "stash"] as const) {
  Deno.test(`golden snapshot JSON after ${slug} demoScript`, async () => {
    const { snapshot } = afterDemo(slug);
    for (const commit of snapshot.commits) {
      assertFortyHex(commit.id, `${slug} commit`);
      for (const parent of commit.parents) {
        assertFortyHex(parent, `${slug} parent`);
      }
    }
    if (snapshot.head) assertFortyHex(snapshot.head, `${slug} HEAD`);
    const actual = stringifySnapshot(snapshot);
    const expected = await Deno.readTextFile(
      new URL(`./golden/${slug}.json`, import.meta.url),
    );
    assertEquals(actual, expected);
  });
}

Deno.test("model and fetch demos simple graph (needsVisOverlay false)", () => {
  assertEquals(needsVisOverlay(afterDemo("model").snapshot), false);
  assertEquals(needsVisOverlay(afterDemo("fetch").snapshot), false);
});

Deno.test("stash demo uses vis-network (two-parent W)", () => {
  const { snapshot } = afterDemo("stash");
  assertEquals(needsVisOverlay(snapshot), true);
  const w = snapshot.refs.find((r) => r.kind === "stash");
  assert(w, "stash ref");
  const commit = snapshot.commits.find((c) => c.id === w.target);
  assert(commit);
  assertEquals(commit.parents.length, 2);
});
