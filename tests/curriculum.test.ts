import { assertEquals } from "@std/assert";
import { getLesson, lessons } from "@/lib/curriculum/mod.ts";
import { LESSON_ORDER } from "@/lib/curriculum/types.ts";
import { GitVM } from "@/lib/git-vm/mod.ts";

Deno.test("15 lessons in chain order", () => {
  assertEquals(lessons.map((l) => l.id), [...LESSON_ORDER]);
});

Deno.test("each lesson startState snapshots and goalCheck is false at start", () => {
  for (const lesson of lessons) {
    const found = getLesson(lesson.id);
    if (!found) throw new Error(`missing ${lesson.id}`);
    const vm = new GitVM(found.startState);
    const snap = vm.snapshot();
    if (found.goalCheck(snap, vm.state)) {
      throw new Error(`${lesson.id} goalCheck true on startState`);
    }
  }
});

Deno.test("each lesson has a viz beat for every demoScript line", async () => {
  const { getLessonViz } = await import("@/lib/curriculum/viz.ts");
  for (const lesson of lessons) {
    const viz = getLessonViz(lesson.id);
    if (!viz) throw new Error(`missing viz for ${lesson.id}`);
    assertEquals(
      viz.beats.length,
      lesson.demoScript.length,
      `${lesson.id} beats ${viz.beats.length} vs demo ${lesson.demoScript.length}`,
    );
    assertEquals(viz.intro.length > 20, true, `${lesson.id} intro`);
    for (const [i, beat] of viz.beats.entries()) {
      if (beat.caption.length < 20) {
        throw new Error(`${lesson.id} beat ${i} caption too short`);
      }
    }
  }
});

Deno.test("each lesson has a notes illustration", async () => {
  const { ILLUSTRATIONS } = await import(
    "@/lib/studio/illustrations/mod.tsx"
  );
  for (const lesson of lessons) {
    if (!ILLUSTRATIONS[lesson.id as keyof typeof ILLUSTRATIONS]) {
      throw new Error(`missing illustration for ${lesson.id}`);
    }
  }
  assertEquals(Object.keys(ILLUSTRATIONS).length, 15);
});
