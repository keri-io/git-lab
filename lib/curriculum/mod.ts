import type { Lesson } from "./types.ts";
import { lesson as amend } from "./lessons/amend.ts";
import { lesson as cherryPick } from "./lessons/cherry-pick.ts";
import { lesson as clone } from "./lessons/clone.ts";
import { lesson as fetch } from "./lessons/fetch.ts";
import { lesson as fork } from "./lessons/fork.ts";
import { lesson as gitflow } from "./lessons/gitflow.ts";
import { lesson as merge } from "./lessons/merge.ts";
import { lesson as model } from "./lessons/model.ts";
import { lesson as pull } from "./lessons/pull.ts";
import { lesson as rebase } from "./lessons/rebase.ts";
import { lesson as reset } from "./lessons/reset.ts";
import { lesson as rewrite } from "./lessons/rewrite.ts";
import { lesson as stash } from "./lessons/stash.ts";
import { lesson as stashConflicts } from "./lessons/stash-conflicts.ts";
import { lesson as worktrees } from "./lessons/worktrees.ts";

export const lessons: Lesson[] = [
  model,
  clone,
  fetch,
  merge,
  pull,
  fork,
  amend,
  reset,
  cherryPick,
  rebase,
  rewrite,
  stash,
  stashConflicts,
  worktrees,
  gitflow,
].sort((a, b) => a.order - b.order);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
