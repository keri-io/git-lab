import type { GitState, Snapshot } from "../git-vm/types.ts";

export interface QuizItem {
  id: string;
  prompt: string;
  choices: string[];
  /** Index into choices */
  answer: number;
  explain: string;
}

/** One visual beat, aligned 1:1 with `lesson.demoScript`. */
export interface VizBeat {
  caption: string;
  /** Pretty ref to dim-the-rest highlight (main, origin/main, stash, feature, …). */
  highlightRef?: string;
  /** Pulse the three-trees cards. */
  pulseTrees?: boolean;
}

export interface LessonViz {
  intro: string;
  beats: VizBeat[];
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  /** Parent lesson ids that must be completed first. */
  unlocksAfter: string[];
  articleUrl?: string;
  narrative: string;
  objectives: string[];
  allowedCommands: string[];
  /** Commands auto-run when the learner hits Play demo. */
  demoScript: string[];
  startState: GitState;
  goalHint: string;
  quiz: QuizItem[];
  goalCheck: (snapshot: Snapshot, state: GitState) => boolean;
  viz: LessonViz;
}

export const LESSON_ORDER = [
  "model",
  "tags",
  "index",
  "clone",
  "packs",
  "reftable",
  "fetch",
  "merge",
  "rerere",
  "pull",
  "fork",
  "amend",
  "reset",
  "cherry-pick",
  "rebase",
  "rebase-onto",
  "rewrite",
  "gc",
  "stash",
  "stash-conflicts",
  "worktrees",
  "gitflow",
  "trunk",
] as const;

export type LessonId = (typeof LESSON_ORDER)[number];
