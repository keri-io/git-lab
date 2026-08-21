import type { ComponentChildren } from "preact";
import type { LessonId } from "@/lib/curriculum/types.ts";
import { AmendIllustration } from "./amend.tsx";
import { CherryPickIllustration } from "./cherry-pick.tsx";
import { CloneIllustration } from "./clone.tsx";
import { FetchIllustration } from "./fetch.tsx";
import { ForkIllustration } from "./fork.tsx";
import { GitflowIllustration } from "./gitflow.tsx";
import { MergeIllustration } from "./merge.tsx";
import { ModelIllustration } from "./model.tsx";
import { PullIllustration } from "./pull.tsx";
import { RebaseIllustration } from "./rebase.tsx";
import { ResetIllustration } from "./reset.tsx";
import { RewriteIllustration } from "./rewrite.tsx";
import { StashIllustration } from "./stash.tsx";
import { StashConflictsIllustration } from "./stash-conflicts.tsx";
import { WorktreesIllustration } from "./worktrees.tsx";

export const ILLUSTRATIONS: Record<LessonId, () => ComponentChildren> = {
  model: () => <ModelIllustration />,
  clone: () => <CloneIllustration />,
  fetch: () => <FetchIllustration />,
  merge: () => <MergeIllustration />,
  pull: () => <PullIllustration />,
  fork: () => <ForkIllustration />,
  amend: () => <AmendIllustration />,
  reset: () => <ResetIllustration />,
  "cherry-pick": () => <CherryPickIllustration />,
  rebase: () => <RebaseIllustration />,
  rewrite: () => <RewriteIllustration />,
  stash: () => <StashIllustration />,
  "stash-conflicts": () => <StashConflictsIllustration />,
  worktrees: () => <WorktreesIllustration />,
  gitflow: () => <GitflowIllustration />,
};

export function LessonIllustration({ lessonId }: { lessonId: string }) {
  const render = ILLUSTRATIONS[lessonId as LessonId];
  if (!render) return null;
  return <div class="lesson-illustration">{render()}</div>;
}
