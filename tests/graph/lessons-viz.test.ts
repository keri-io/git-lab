import { assert, assertEquals } from "@std/assert";
import { getLesson, lessons } from "@/lib/curriculum/mod.ts";
import { getLessonViz } from "@/lib/curriculum/viz.ts";
import { GitVM } from "@/lib/git-vm/mod.ts";
import { layoutCommitGraph } from "@/lib/graph/layout.ts";
import { needsVisOverlay } from "@/lib/graph/policy.ts";

Deno.test("every lesson demo paints a layout the interactive graph can use", () => {
  const gaps: string[] = [];

  for (const lesson of lessons) {
    const viz = getLessonViz(lesson.id);
    if (!viz) {
      gaps.push(`${lesson.id}: missing viz`);
      continue;
    }
    const vm = new GitVM(lesson.startState);

    for (let i = 0; i < lesson.demoScript.length; i++) {
      const line = lesson.demoScript[i]!;
      const result = vm.exec(line);
      const layout = layoutCommitGraph(result.snapshot);
      const beat = viz.beats[i];
      if (!beat) {
        gaps.push(`${lesson.id} step ${i}: no beat`);
        continue;
      }
      if (beat.highlightRef) {
        const names = Object.keys(layout.branchHeads);
        if (
          layout.nodes.length > 0 &&
          !names.includes(beat.highlightRef)
        ) {
          gaps.push(
            `${lesson.id} step ${i}: highlight "${beat.highlightRef}" not in [${
              names.join(", ")
            }] after ${line}`,
          );
        }
      }
    }

    const end = vm.snapshot();
    const endLayout = layoutCommitGraph(end);
    if (!lesson.goalCheck(end, vm.state)) {
      gaps.push(`${lesson.id}: demo did not reach goal`);
    }

    if (lesson.id === "model" || lesson.id === "clone") {
      if (endLayout.nodes.length < 1) {
        gaps.push(`${lesson.id}: expected at least one commit node after demo`);
      }
    } else if (endLayout.nodes.length < 1) {
      gaps.push(`${lesson.id}: empty graph after demo`);
    }

    if (lesson.id === "stash" || lesson.id === "stash-conflicts") {
      if (!endLayout.branchHeads.stash && lesson.id === "stash") {
        gaps.push(`${lesson.id}: expected stash ref on the graph`);
      }
    }
    if (lesson.id === "worktrees") {
      const diamonds = endLayout.extras.filter((e) => e.kind === "worktree");
      if (diamonds.length < 2) {
        gaps.push(
          `${lesson.id}: expected two worktree extras, got ${diamonds.length}`,
        );
      }
      assertEquals(needsVisOverlay(end), true);
    }
    if (lesson.id === "merge" || lesson.id === "gitflow") {
      if (!endLayout.nodes.some((n) => n.isMerge)) {
        gaps.push(`${lesson.id}: expected a merge commit on the graph`);
      }
    }
    if (lesson.id === "fetch" || lesson.id === "pull" || lesson.id === "clone") {
      if (!endLayout.branchHeads["origin/main"]) {
        gaps.push(`${lesson.id}: expected origin/main on the graph`);
      }
    }
  }

  assertEquals(gaps, [], gaps.join("\n"));
});

Deno.test("interactive SVG module exports the visual-learner surface", async () => {
  const src = await Deno.readTextFile(
    new URL("../../lib/graph/interactive_svg.ts", import.meta.url),
  );
  assert(src.includes("renderInteractiveSvg"));
  assert(src.includes("lg-graph-inspect"));
  assert(src.includes("highlightRef"));
  assert(src.includes("Zoom In"));
});
