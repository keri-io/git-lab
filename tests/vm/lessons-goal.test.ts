import { assert } from "@std/assert";
import { lessons } from "@/lib/curriculum/mod.ts";
import { GitVM } from "@/lib/git-vm/mod.ts";

for (const lesson of lessons) {
  Deno.test(`lesson ${lesson.id} demoScript reaches goalCheck`, () => {
    const vm = new GitVM(lesson.startState);
    for (const line of lesson.demoScript) {
      const r = vm.exec(line);
      assert(
        r.ok || r.stderr.includes("CONFLICT (content)"),
        `${lesson.id}: ${line}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`,
      );
    }
    assert(
      lesson.goalCheck(vm.snapshot(), vm.state),
      `${lesson.id} goalCheck false after demoScript`,
    );
  });
}
