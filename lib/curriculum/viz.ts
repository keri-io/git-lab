import type { LessonId, LessonViz, VizBeat } from "./types.ts";
import { lessons } from "./mod.ts";

export type { LessonViz, VizBeat };

export function getLessonViz(id: string): LessonViz | undefined {
  return lessons.find((lesson) => lesson.id === id)?.viz;
}

export function vizBeat(id: string, index: number): VizBeat | undefined {
  return getLessonViz(id)?.beats[index];
}

/** Hint after a typed command (not only Play Demo). */
export function vizAfterCommand(
  lessonId: string,
  line: string,
): VizBeat | undefined {
  const viz = getLessonViz(lessonId);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!viz || !lesson) return undefined;
  const trimmed = line.trim();
  const idx = lesson.demoScript.findIndex((cmd) =>
    trimmed === cmd || trimmed.startsWith(`${cmd} `)
  );
  if (idx >= 0) return viz.beats[idx];
  return hintFromPorcelain(trimmed);
}

function hintFromPorcelain(line: string): VizBeat | undefined {
  if (line.startsWith("git fetch")) {
    return {
      caption:
        "Remote-tracking refs moved. Local branch and files stay until you merge or pull.",
      highlightRef: "origin/main",
    };
  }
  if (line.startsWith("git pull")) {
    return {
      caption:
        "Fetch plus integrate. If it fast-forwarded, main simply slid to origin/main.",
      highlightRef: "main",
      pulseTrees: true,
    };
  }
  if (line.startsWith("git merge")) {
    return {
      caption:
        "Look for a two-parent node (merge) or a label that jumped (fast-forward). Conflicts stay in the index.",
    };
  }
  if (line.includes("stash")) {
    return {
      caption:
        "Stash is commits: W with parents H and I. Click the mauve node.",
      highlightRef: "stash",
    };
  }
  if (line.startsWith("git rebase") || line.startsWith("git cherry-pick")) {
    return {
      caption:
        "New hashes on the current branch. Old commits may still be on the canvas, dangling.",
    };
  }
  if (line.startsWith("git reset") || line.includes("amend")) {
    return {
      caption:
        "The branch label moved. Dim nodes are still objects — click them.",
      highlightRef: "main",
    };
  }
  if (line.startsWith("git worktree")) {
    return {
      caption:
        "Extra diamonds are extra checkouts sharing this object database.",
    };
  }
  if (line.startsWith("git add") || line.startsWith("git commit")) {
    return {
      caption:
        "Add updates the index; commit writes objects and moves the branch.",
      pulseTrees: true,
    };
  }
  return undefined;
}
