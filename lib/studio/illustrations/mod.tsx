import type { ComponentChildren } from "preact";
import type { LessonId } from "@/lib/curriculum/types.ts";
import { AmendIllustration } from "./amend.tsx";
import { CherryPickIllustration } from "./cherry-pick.tsx";
import { CloneIllustration } from "./clone.tsx";
import { FetchIllustration } from "./fetch.tsx";
import { ForkIllustration } from "./fork.tsx";
import { GcIllustration } from "./gc.tsx";
import { GitflowIllustration } from "./gitflow.tsx";
import { IndexIllustration } from "./index.tsx";
import { MergeIllustration } from "./merge.tsx";
import { ModelIllustration } from "./model.tsx";
import { PacksIllustration } from "./packs.tsx";
import { PullIllustration } from "./pull.tsx";
import { RebaseIllustration } from "./rebase.tsx";
import { RebaseOntoIllustration } from "./rebase-onto.tsx";
import { ReftableIllustration } from "./reftable.tsx";
import { RerereIllustration } from "./rerere.tsx";
import { ResetIllustration } from "./reset.tsx";
import { RewriteIllustration } from "./rewrite.tsx";
import { StashIllustration } from "./stash.tsx";
import { StashConflictsIllustration } from "./stash-conflicts.tsx";
import { TagsIllustration } from "./tags.tsx";
import { TrunkIllustration } from "./trunk.tsx";
import { WorktreesIllustration } from "./worktrees.tsx";

export const ILLUSTRATIONS: Record<LessonId, () => ComponentChildren> = {
  model: () => <ModelIllustration />,
  tags: () => <TagsIllustration />,
  index: () => <IndexIllustration />,
  clone: () => <CloneIllustration />,
  packs: () => <PacksIllustration />,
  reftable: () => <ReftableIllustration />,
  fetch: () => <FetchIllustration />,
  merge: () => <MergeIllustration />,
  rerere: () => <RerereIllustration />,
  pull: () => <PullIllustration />,
  fork: () => <ForkIllustration />,
  amend: () => <AmendIllustration />,
  reset: () => <ResetIllustration />,
  "cherry-pick": () => <CherryPickIllustration />,
  rebase: () => <RebaseIllustration />,
  "rebase-onto": () => <RebaseOntoIllustration />,
  rewrite: () => <RewriteIllustration />,
  gc: () => <GcIllustration />,
  stash: () => <StashIllustration />,
  "stash-conflicts": () => <StashConflictsIllustration />,
  worktrees: () => <WorktreesIllustration />,
  gitflow: () => <GitflowIllustration />,
  trunk: () => <TrunkIllustration />,
};

export function LessonIllustration({ lessonId }: { lessonId: string }) {
  const render = ILLUSTRATIONS[lessonId as LessonId];
  if (!render) return null;
  return <div class="lesson-illustration">{render()}</div>;
}
