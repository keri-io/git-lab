import { GitVM } from "@/lib/git-vm/mod.ts";
import { getLesson } from "@/lib/curriculum/mod.ts";
import { stringifySnapshot } from "@/lib/graph/serialize.ts";

const slugs = Deno.args.length ? Deno.args : ["model", "fetch", "stash"];
const outDir = new URL("./golden/", import.meta.url);

await Deno.mkdir(outDir, { recursive: true });

for (const id of slugs) {
  const lesson = getLesson(id);
  if (!lesson) throw new Error(`missing lesson ${id}`);
  const vm = new GitVM(lesson.startState);
  for (const line of lesson.demoScript) {
    const r = vm.exec(line);
    if (!r.ok) throw new Error(`${id}: ${line}\n${r.stderr}`);
  }
  const json = stringifySnapshot(vm.snapshot());
  const path = new URL(`${id}.json`, outDir);
  await Deno.writeTextFile(path, json);
  console.log("wrote", path.pathname);
}
