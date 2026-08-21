import { seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
startState.worktrees[0].files["README.md"] = "# demo\ndraft\n";

export const lesson: Lesson = {
  id: "stash",
  order: 19,
  title: "Stash: commits that are not on a branch",
  unlocksAfter: ["gc"],
  articleUrl: "https://www.themoderncoder.com/git-stash/",
  narrative:
    `Stash writes real commits, then resets your worktree to HEAD so you can switch branches. It is not a clipboard. Default stash ignores untracked files: new files you never git add’d still sit in the worktree. Fix that with git add then stash, or git stash push -u.

From git-stash(1): H is HEAD when you stashed; I is a commit whose tree is the index (parent H); W is a merge commit whose tree is the working directory (parents H and I). -u adds a third parent for untracked files.

refs/stash points at W. Older entries are the reflog of that ref. Then Git resets index and worktree to H. That is why stash show can diff, why stash branch can recreate the starting point, and why dropped stashes sometimes show up in git fsck before GC.

git stash apply restores and keeps the entry. pop is apply plus drop if apply succeeded.

README.md is dirty (a draft line) and untracked files are none. Stash the draft so status is clean and stash@{0} names W. The object database grew; main did not move.`,
  objectives: [
    "Describe stash as commits W (and I) off to the side, then a reset to H.",
    "Include untracked files with -u (or add first); default stash ignores them.",
    "Contrast apply (keep) with pop (drop only if apply succeeded).",
    "Hide the draft so the worktree matches HEAD and stash is non-empty.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git stash",
    "git stash push",
    'git stash push -m "wip"',
    "git stash push -u",
    "git stash apply",
    "git stash pop",
    "git stash drop",
    "git stash branch",
    "git ls-files",
    "git reflog",
  ],
  demoScript: [
    "git status",
    'git stash push -m "wip"',
    "git status",
    "git log --oneline",
    "git ls-files",
  ],
  startState,
  goalHint:
    "Stash the dirty README so the worktree matches HEAD and stash@{0} exists. Apply is optional; pop is not required.",
  quiz: [
    {
      id: "stash-q1",
      prompt: "The stash ref points at…",
      choices: [
        "H, the HEAD you left",
        "W, a merge commit whose tree is the stashed worktree",
        "A blob of concatenated diffs",
        "origin/main",
      ],
      answer: 1,
      explain:
        "W’s parents are H and I (index). That graph is why stash is real history, not a clipboard.",
    },
    {
      id: "stash-q2",
      prompt: "After git stash (default, no -u), untracked files…",
      choices: [
        "Are in W’s tree",
        "Still sit in the worktree",
        "Are deleted",
        "Become index stage 3",
      ],
      answer: 1,
      explain:
        "Default stash only records tracked files (and the index). git stash push -u includes untracked.",
    },
    {
      id: "stash-q3",
      prompt: "git stash pop vs apply…",
      choices: [
        "They are identical",
        "pop is apply, then drop only if apply succeeded",
        "apply deletes the stash; pop keeps it",
        "pop never conflicts",
      ],
      answer: 1,
      explain:
        "A conflicting apply leaves the stash listed on purpose. Drop yourself after you resolve.",
    },
    {
      id: "stash-q4",
      prompt: "git stash branch rescue stash@{0}…",
      choices: [
        "Pushes the stash to origin",
        "Checks out original H, applies there, and drops the stash",
        "Creates a merge commit on main",
        "Converts W into a tag",
      ],
      answer: 1,
      explain:
        "When the current tip is a bad place to apply, recreate the starting point as a branch.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (state.stash.length < 1) return false;
    const head = snapshot.head;
    if (!head) return false;
    const obj = state.objects[head];
    if (!obj || obj.type !== "commit") return false;
    const tree = state.objects[obj.tree];
    if (!tree || tree.type !== "tree") return false;
    const readme = tree.entries.find((e) => e.name === "README.md");
    if (!readme) return false;
    const blob = state.objects[readme.id];
    if (!blob || blob.type !== "blob") return false;
    return snapshot.files["README.md"] === blob.content;
  },
};
