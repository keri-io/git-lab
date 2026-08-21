import { assertEquals } from "@std/assert";
import {
  isLessonComplete,
  isUnlocked,
  type LessonProgress,
} from "@/lib/progress.ts";

function progress(
  patch: Partial<LessonProgress> = {},
): LessonProgress {
  return {
    v: 2,
    goalPassed: [],
    quizPassed: [],
    completed: [],
    brokenInto: [],
    ...patch,
  };
}

Deno.test("isUnlocked is false until prior goal and quiz both pass", () => {
  assertEquals(
    isUnlocked("clone", ["model"], progress()),
    false,
  );
  assertEquals(
    isUnlocked(
      "clone",
      ["model"],
      progress({ goalPassed: ["model"], completed: ["model"] }),
    ),
    false,
  );
  assertEquals(
    isUnlocked(
      "clone",
      ["model"],
      progress({
        goalPassed: ["model"],
        quizPassed: ["model"],
        completed: ["model"],
      }),
    ),
    true,
  );
});

Deno.test("brokenInto unlocks a lesson without prior quizzes", () => {
  const p = progress({ brokenInto: ["fetch"] });
  assertEquals(isUnlocked("fetch", ["clone"], p), true);
  assertEquals(isLessonComplete("clone", p), false);
  assertEquals(isUnlocked("merge", ["fetch"], p), false);
});
