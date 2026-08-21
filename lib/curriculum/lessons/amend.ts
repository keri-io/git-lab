import { mainTip, seededLocalFromOrigin, treeHas } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const originalTip = mainTip(startState);
startState.worktrees[0].files["extra.md"] = "forgot this\n";

export const lesson: Lesson = {
  id: "amend",
  order: 7,
  title: "Amend: the smallest rewrite",
  unlocksAfter: ["fork"],
  articleUrl: "https://www.themoderncoder.com/rewriting-git-history/",
  narrative:
    `Amend writes a new commit with the same parent(s) and moves the branch label. Objects never change; labels move. The long way is git reset HEAD~1 (uncommit, keep the index) then re-stage and commit. Amend is that in one step.

Take the current index (stage forgotten files first). Git writes a new tree, then a new commit with the same parent(s) as HEAD, and moves the branch to the new hash. The old commit is dangling and still in the reflog.

--no-edit keeps the message. --amend on a merge commit keeps both parents. Author stays by default; the committer becomes you now.

Do not amend a commit you already pushed unless you will force-push a private branch. extra.md is sitting untracked in the worktree: the classic forgotten file. Add it and git commit --amend --no-edit so HEAD is a new id whose tree contains extra.md, while the initial commit object remains in the database.`,
  objectives: [
    "State that amend writes a new commit with the same parent(s) and moves the branch.",
    "Stage forgotten files before amending so they enter the new tree.",
    "Find the old hash still stored (and listed in reflog).",
    "Avoid amending published commits on shared branches.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git add",
    "git add extra.md",
    "git add .",
    "git commit",
    "git commit --amend",
    "git commit --amend --no-edit",
    "git reflog",
    "git cat-file",
    "git ls-files",
  ],
  demoScript: [
    "git status",
    "git add extra.md",
    "git commit --amend --no-edit",
    "git log --oneline",
    "git reflog",
    "git status",
  ],
  startState,
  goalHint:
    "Add extra.md and amend the last commit (keep the message) so HEAD is a new hash that contains extra.md.",
  quiz: [
    {
      id: "amend-q1",
      prompt: "After a successful amend, the original commit…",
      choices: [
        "Is overwritten in place with a new tree",
        "Is gone from disk immediately",
        "Still exists as an object; the branch now points at a new id",
        "Has its message field mutated",
      ],
      answer: 2,
      explain:
        "Immutability: new tree, new commit, moved label. reflog still names the old hash.",
    },
    {
      id: "amend-q2",
      prompt: "The new commit’s parent is…",
      choices: [
        "The commit you amended",
        "The same parent(s) the old HEAD had",
        "Always empty (it becomes a root)",
        "origin/main",
      ],
      answer: 1,
      explain:
        "Amend is a one-commit rebase onto the same parent. The amended commit is not a parent of its replacement.",
    },
    {
      id: "amend-q3",
      prompt: "You forgot extra.md in the last commit. The fix is…",
      choices: [
        "git add extra.md && git commit --amend --no-edit",
        "git merge extra.md",
        "git fetch extra.md",
        "edit the old commit object in .git/objects",
      ],
      answer: 0,
      explain:
        "Amend uses the index. Forgotten files must be staged or they will not enter the new tree.",
    },
    {
      id: "amend-q4",
      prompt: "When is amending dangerous?",
      choices: [
        "On any local unpushed commit",
        "On a commit other people already based work on, unless the team agreed to force-push",
        "Whenever the message stays the same",
        "Only if the tree did not change",
      ],
      answer: 1,
      explain:
        "Private unpushed commits are fair game. Shared history needs a new commit (or an agreed rewrite).",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (!snapshot.head || snapshot.head === originalTip) return false;
    const obj = state.objects[snapshot.head];
    if (!obj || obj.type !== "commit") return false;
    const old = state.objects[originalTip];
    return (
      old?.type === "commit" &&
      obj.parents.length === old.parents.length &&
      treeHas(state, snapshot.head, "extra.md")
    );
  },
};
