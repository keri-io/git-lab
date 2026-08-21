import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "main", "add notes", {
  "README.md": "# demo\nfrom main\n",
  "NOTES.md": "local notes\n",
});
commitOnBranch(startState, "feature", "add app", {
  "README.md": "# demo\nfrom feature\n",
  "app.ts": "export const ok = true;\n",
}, { from: initial, checkout: false });

export const lesson: Lesson = {
  id: "merge",
  order: 8,
  title: "Merge, and what a conflict is",
  unlocksAfter: ["fetch"],
  articleUrl: "https://www.themoderncoder.com/git-merge/",
  narrative:
    `Merge is how Git combines two tips. It finds the merge base (best common ancestor). If main is an ancestor of the named commit, Git fast-forwards: it only moves the main label. If both sides moved, Git does a three-way merge of the base tree, ours (HEAD), and theirs, then writes a merge commit with two parents.

git merge --no-ff always makes that bubble; GitFlow relies on it. git merge --abort restores the pre-merge state.

When both sides changed the same region, Git cannot pick a tree. The index changes shape. A normal file is stage 0 (one blob). A conflicted path becomes three unmerged stages: 1 base, 2 ours, 3 theirs.

The working-tree file gets conflict markers. git add of the resolved bytes is the resolution: stages 1/2/3 collapse to stage 0 and a new blob. Editing without add leaves the path unmerged. Then you commit the merge; do not skip that commit.

A second failure mode never enters markers: uncommitted local edits that would be overwritten. Git refuses to start. Commit or stash first. The same stage-1/2/3 machinery comes back for cherry-pick, rebase, and stash pop.

Your graph already diverged: main added NOTES.md, feature added app.ts from the same initial commit. Merge feature to get a two-parent commit.`,
  objectives: [
    "Distinguish fast-forward from a two-parent merge commit.",
    "Name index stages 1, 2, and 3 during a content conflict.",
    "Treat git add as the signal that a conflict is resolved.",
    "Merge feature into main so HEAD is a merge commit.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git merge",
    "git merge feature",
    "git merge --no-ff",
    "git merge --no-ff feature",
    "git merge --abort",
    "git add",
    "git add README.md",
    "git commit",
    "git ls-files",
    "git ls-files -u",
    "git branch",
    "git switch",
    "git checkout",
    "git checkout --ours",
    "git checkout --theirs",
    "git checkout --ours -- README.md",
    "git checkout --theirs -- README.md",
    "edit",
    "edit README.md",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git branch",
    "git merge feature",
    "git ls-files -u",
    "git checkout --theirs -- README.md",
    "git add README.md",
    "git commit",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "On main, merge feature so HEAD is a commit with two parents (NOTES.md and app.ts together).",
  quiz: [
    {
      id: "merge-q1",
      prompt: "When both branches moved, a successful merge writes…",
      choices: [
        "No new object; it copies files from feature",
        "A commit with two parents whose tree is the merge result",
        "Three new blobs and deletes the merge base",
        "A fast-forward even if main is not an ancestor",
      ],
      answer: 1,
      explain:
        "The merge commit’s first parent is HEAD, second is the named tip. Fast-forward happens only when HEAD is already an ancestor.",
    },
    {
      id: "merge-q2",
      prompt: "In a conflict, index stage 2 is…",
      choices: [
        "The merge base",
        "Ours (HEAD)",
        "Theirs (the branch you named)",
        "The resolved file",
      ],
      answer: 1,
      explain:
        "Stage 1 is base, 2 is ours, 3 is theirs. git ls-files -u lists all three until git add collapses them to stage 0.",
    },
    {
      id: "merge-q3",
      prompt:
        "You deleted the conflict markers but git status still says unmerged. Why?",
      choices: [
        "You must git merge --continue",
        "The blob hash cannot change until you push",
        "git add is the resolution; without it stages 1/2/3 remain",
        "You need git reset --hard",
      ],
      answer: 2,
      explain:
        "Editing the worktree is not enough. add writes a new blob and replaces the unmerged stages.",
    },
    {
      id: "merge-q4",
      prompt:
        "Your local changes would be overwritten by merge. What happened?",
      choices: [
        "You are in a content conflict with markers in the file",
        "Git aborted before starting; commit or stash, then merge again",
        "The index already has stages 1, 2, and 3",
        "HEAD detached and Git fast-forwarded",
      ],
      answer: 1,
      explain:
        "Dirty-worktree abort is not a conflict. Git refuses to clobber uncommitted bytes.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (!snapshot.head) return false;
    const obj = state.objects[snapshot.head];
    return obj?.type === "commit" && obj.parents.length === 2;
  },
};
