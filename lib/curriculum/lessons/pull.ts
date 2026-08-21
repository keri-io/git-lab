import { commitOnRemote, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const behind = startState.refs["refs/heads/main"]!;
commitOnRemote(startState, "origin", "origin moved", {
  "README.md": "# demo\n",
  "NOTES.md": "pulled from origin\n",
});
const remoteTip = startState.remotes.origin.refs["refs/heads/main"]!;

export const lesson: Lesson = {
  id: "pull",
  order: 5,
  title: "git pull: fetch then merge",
  unlocksAfter: ["merge"],
  narrative:
    `git pull is fetch, then integrate into the current branch. Fetch still downloads missing objects and updates remote-tracking refs. Pull then merges (historically git merge FETCH_HEAD). The working tree and index can change.

Pull can fast-forward, write a merge commit, or conflict. Fetch alone cannot.

git pull --ff-only integrates only if the result is a fast-forward; otherwise it aborts. git pull --rebase rebases local commits instead (you will unpack that after rebase). From Git 2.27 a pull without a configured policy warns.

Practical rule: fetch, look, then merge. Pull is fine on a clean branch when you accept the default policy.

This sandbox is a clean clone whose origin/main has one extra commit (NOTES.md). Local main still points at the initial README. Pull --ff-only so local main, origin/main, and the worktree all meet at that tip.`,
  objectives: [
    "Define pull as fetch plus integrate-into-current-branch.",
    "Contrast pull’s mutation of worktree/index with fetch’s safety.",
    "Use --ff-only when you want merge only if it is a fast-forward.",
    "Bring local main even with origin after a fast-forward pull.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git fetch",
    "git fetch origin",
    "git pull",
    "git pull --ff-only",
    "git merge",
    "git merge origin/main",
  ],
  demoScript: [
    "git status",
    "git fetch origin",
    "git log --oneline",
    "git pull --ff-only",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "Fast-forward main to origin’s tip so NOTES.md appears and local main matches origin/main.",
  quiz: [
    {
      id: "pull-q1",
      prompt: "After git fetch, what has pull not done yet?",
      choices: [
        "Download missing objects",
        "Update refs/remotes/origin/main",
        "Move refs/heads/main and update the worktree",
        "Record FETCH_HEAD",
      ],
      answer: 2,
      explain:
        "Fetch stops at tracking refs. Pull’s second half is the merge or rebase into HEAD.",
    },
    {
      id: "pull-q2",
      prompt: "git pull --ff-only fails when…",
      choices: [
        "Origin has any new commit",
        "The integration would not be a fast-forward",
        "The worktree is clean",
        "You have never set pull.rebase",
      ],
      answer: 1,
      explain:
        "--ff-only refuses a merge commit. Diverged local commits need an explicit merge, rebase, or reset.",
    },
    {
      id: "pull-q3",
      prompt: "Which statement is true?",
      choices: [
        "Pull never conflicts because fetch already merged",
        "Pull can merge-commit or conflict; fetch cannot",
        "Pull updates only remote-tracking refs",
        "Pull and fetch are identical on a dirty worktree",
      ],
      answer: 1,
      explain:
        "The extra integrate step is why pull is the dangerous one-liner and fetch is the safe habit.",
    },
    {
      id: "pull-q4",
      prompt: "git pull --rebase is…",
      choices: [
        "fetch, then rebase local commits onto the updated tracking branch",
        "rebase origin onto your worktree without fetching",
        "the same as git reset --hard origin/main",
        "a fast-forward of origin",
      ],
      answer: 0,
      explain:
        "Same fetch; different second half. You will treat rebase as cherry-pick in a loop two chapters from now.",
    },
  ],
  goalCheck: (snapshot, state) => {
    return (
      state.refs["refs/heads/main"] === remoteTip &&
      state.refs["refs/remotes/origin/main"] === remoteTip &&
      snapshot.head !== behind &&
      snapshot.files["NOTES.md"] === "pulled from origin\n"
    );
  },
};
