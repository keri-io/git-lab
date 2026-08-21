import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "main", "wip notes", {
  "README.md": "# demo\n",
  "NOTES.md": "scratch\n",
});

export const lesson: Lesson = {
  id: "reset",
  order: 8,
  title: "Reset and reflog: move the label on purpose",
  unlocksAfter: ["amend"],
  narrative:
    `git reset moves the branch to any commit, and optionally drags the index and working tree with it. --soft moves HEAD only (index and files unchanged: uncommit, keep everything staged). --mixed, the default, moves HEAD and makes the index match the target (file edits remain).

--hard moves HEAD, index, and files. You need this before rebase (rebase resets, then replays) and before you trust --hard.

--hard is recoverable only while the old HEAD is in the reflog: git reflog, then git reset --hard HEAD@{1}. Reflog is a local ledger of every HEAD movement. It is not pushed, so another clone cannot save you. After a panic reset, look there before you run gc.

main currently has two commits: initial README, then wip notes. Reset --hard HEAD~1 so the branch label, index, and files all sit on the root commit. Then read the reflog: the wip commit is still an object.`,
  objectives: [
    "Contrast --soft, --mixed, and --hard on HEAD vs index vs worktree.",
    "Use HEAD~1 as the first parent of the current commit.",
    "Recover a hard reset from reflog while the old tip is still referenced there.",
    "Move main back to the initial commit.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git reset",
    "git reset --soft",
    "git reset --mixed",
    "git reset --hard",
    "git reset --hard HEAD~1",
    "git reset --soft HEAD~1",
    "git reflog",
    "git ls-files",
    "git cat-file",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git reset --hard HEAD~1",
    "git log --oneline",
    "git reflog",
    "git status",
  ],
  startState,
  goalHint:
    "Reset main hard to HEAD~1 so you are back on the initial README-only commit.",
  quiz: [
    {
      id: "reset-q1",
      prompt: "git reset --soft HEAD~1…",
      choices: [
        "Deletes the files that commit introduced",
        "Moves HEAD; index and worktree still match the commit you left",
        "Moves HEAD and the index, leaves the worktree",
        "Moves all three trees to origin/main",
      ],
      answer: 1,
      explain:
        "Soft is uncommit-keep-staged. Mixed unstages. Hard throws the work away (into reflog).",
    },
    {
      id: "reset-q2",
      prompt: "git reset --hard HEAD~1 vs git reset HEAD~1 (mixed)…",
      choices: [
        "They are identical",
        "Hard also makes the worktree match the target; mixed leaves file contents",
        "Mixed deletes objects; hard does not",
        "Hard cannot be undone even with reflog",
      ],
      answer: 1,
      explain:
        "Mixed is the default: uncommit, keep edits unstaged. Hard aligns files too.",
    },
    {
      id: "reset-q3",
      prompt: "You hard-reset by mistake. First look at…",
      choices: [
        "origin, because reflog is pushed",
        "git reflog, then reset --hard to the old HEAD entry",
        "git fetch, which restores dangling commits",
        "git merge --abort",
      ],
      answer: 1,
      explain:
        "Reflog is local. HEAD@{1} is the pre-reset tip. It is not on the server.",
    },
    {
      id: "reset-q4",
      prompt: "HEAD~1 means…",
      choices: [
        "The remote-tracking branch",
        "The first parent of the current HEAD commit",
        "The stash",
        "Index stage 1",
      ],
      answer: 1,
      explain:
        "For a linear history that is the previous commit on the branch. Merge commits have a second parent too (~2 / ^2).",
    },
  ],
  goalCheck: (snapshot, state) => {
    return snapshot.head === initial &&
      state.refs["refs/heads/main"] === initial &&
      snapshot.files["NOTES.md"] === undefined;
  },
};
