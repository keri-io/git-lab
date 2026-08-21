import type { GitState, Snapshot } from "../git-vm/types.ts";

export interface QuizItem {
  id: string;
  prompt: string;
  choices: string[];
  /** Index into choices */
  answer: number;
  explain: string;
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
}

export const LESSON_ORDER = [
  "model",
  "clone",
  "fetch",
  "merge",
  "pull",
  "fork",
  "amend",
  "reset",
  "cherry-pick",
  "rebase",
  "rewrite",
  "stash",
  "stash-conflicts",
  "worktrees",
  "gitflow",
] as const;

export type LessonId = (typeof LESSON_ORDER)[number];
