import { commitOnRemote, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const localTip = startState.refs["refs/heads/main"]!;
commitOnRemote(startState, "origin", "upstream docs", {
  "README.md": "# demo\n",
  "NOTES.md": "from origin\n",
});
const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

export const lesson: Lesson = {
  id: "fetch",
  order: 7,
  title: "git fetch: download, do not integrate",
  unlocksAfter: ["reftable"],
  narrative:
    `git fetch is the same network step as clone, without moving your branch or touching your files. The client now sends have for objects it already stores, so the pack is only new history. Git then updates refs/remotes/origin/*. Your refs/heads/main does not move.

git status may say you are behind origin/main because it compares two labels. After fetch, local main can sit one commit behind origin/main. The next move is git merge origin/main, not pull yet. Inspect with git log HEAD..origin/main for commits they have and you do not.

Fetch is always safe: it only grows the object database and moves remote-tracking refs. Integration waits for the merge chapter.

Your sandbox starts cloned at the initial README commit. Origin’s main has walked forward to a commit that adds NOTES.md. Fetch so origin/main matches that tip while README.md in the worktree stays # demo and local main stays put.`,
  objectives: [
    "Describe fetch as pack negotiation plus updating remote-tracking refs.",
    "Show that worktree, index, and refs/heads/main are unchanged after fetch.",
    "Read behind/ahead as a comparison of two ref names.",
    "Leave integration for merge (and later pull).",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git fetch",
    "git fetch origin",
    "git branch",
    "git cat-file",
    "git ls-files",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git fetch origin",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "Run git fetch origin. Local main and README.md must stay put; origin/main should advance.",
  quiz: [
    {
      id: "fetch-q1",
      prompt: "What does git fetch change?",
      choices: [
        "HEAD, the index, and the worktree",
        "Only objects plus refs/remotes/origin/* (and similar tracking refs)",
        "refs/heads/main to match origin",
        "The remote server’s branches",
      ],
      answer: 1,
      explain:
        "Fetch never checks out. Integration is a later merge or rebase of those tracking refs.",
    },
    {
      id: "fetch-q2",
      prompt: "git status says you are behind origin/main. Why?",
      choices: [
        "The worktree files are older than the index",
        "It compares refs/heads/main with refs/remotes/origin/main",
        "The packfile failed to unpack NOTES.md",
        "HEAD is detached",
      ],
      answer: 1,
      explain:
        "Behind/ahead is two labels. Your files can be clean and still be behind the tracking ref.",
    },
    {
      id: "fetch-q3",
      prompt: "Why is fetch always safe relative to pull?",
      choices: [
        "It cannot download a rewritten branch",
        "It never mutates the current branch, index, or worktree",
        "It fast-forwards main automatically",
        "It deletes local commits that origin does not have",
      ],
      answer: 1,
      explain:
        "Pull integrates into the current branch and can conflict. Fetch only grows storage and moves sticky notes.",
    },
    {
      id: "fetch-q4",
      prompt: "After fetch, git log HEAD..origin/main shows…",
      choices: [
        "Commits you have that they do not",
        "Commits they have that you do not",
        "Every commit in the packfile",
        "Only merge commits",
      ],
      answer: 1,
      explain:
        "A..B is reachable from B but not A. Swap the ends for the opposite set.",
    },
  ],
  goalCheck: (snapshot, state) => {
    return (
      state.refs["refs/remotes/origin/main"] === remoteTip &&
      state.refs["refs/heads/main"] === localTip &&
      snapshot.files["README.md"] === "# demo\n" &&
      snapshot.files["NOTES.md"] === undefined
    );
  },
};
