import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "hotfix", "hotfix patch", {
  "README.md": "# demo\nhotfix\n",
}, { from: initial, checkout: false });

export const lesson: Lesson = {
  id: "worktrees",
  order: 14,
  title: "Worktrees: isolation without stashing",
  unlocksAfter: ["stash-conflicts"],
  articleUrl: "https://gist.github.com/ashwch/946ad983977c9107db7ee9abafeb95bd",
  narrative:
    `Each worktree has its own HEAD, index, worktree reflog, and files, and they share .git/objects. Stash is for a short interruption; for two branches at once, check out twice.

git worktree add ../repo-hotfix hotfix creates that folder, does not copy objects, and writes a gitdir file pointing at .git/worktrees/<name>/. It refuses if that branch is already checked out: one branch per worktree.

git fetch in any worktree updates the shared database. git worktree list / remove / prune manage the extras. Compared with stash: uncommitted work stays visible as normal files in another folder; you can build and test two branches; each worktree needs its own submodule init; disk cost is a full working copy per tree.

A bare repo stores objects and refs with no checkout: the git dir has no working-tree files. This lesson starts with main already checked out, and you add an extra worktree for hotfix. On a bare repo, git worktree add creates the first checkout, and git worktree list shows (bare).

main is checked out here. hotfix already exists as a ref. Add a second worktree at ../hotfix on that branch. The graph’s objects do not duplicate; you get another index and another set of files.`,
  objectives: [
    "Share one object database across worktrees; give each its own HEAD and index.",
    "Add a worktree for a branch that is not already checked out.",
    "Prefer a worktree over stash when you need two checkouts at once.",
    "List the extra worktree after git worktree add.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git worktree",
    "git worktree add",
    "git worktree add ../hotfix hotfix",
    "git worktree list",
    "git worktree remove",
    "git worktree remove ../hotfix",
    "git branch",
    "git switch",
    "git checkout",
  ],
  demoScript: [
    "git status",
    "git branch",
    "git worktree add ../hotfix hotfix",
    "git worktree list",
    "git status",
    "git log --oneline",
  ],
  startState,
  goalHint:
    "git worktree add ../hotfix hotfix so this repo has two worktrees sharing objects.",
  quiz: [
    {
      id: "wt-q1",
      prompt: "A linked worktree…",
      choices: [
        "Copies every object into a second .git/objects",
        "Shares objects; has its own HEAD, index, and files",
        "Is a stash under another name",
        "Cannot run git fetch",
      ],
      answer: 1,
      explain:
        "The extra .git is a file pointing at the main repo’s worktrees metadata. Objects stay unique by hash.",
    },
    {
      id: "wt-q2",
      prompt: "git worktree add for a branch already checked out…",
      choices: [
        "Succeeds and both trees share the same index",
        "Refuses; one branch per worktree",
        "Detaches HEAD in the first tree",
        "Stashes the first tree automatically",
      ],
      answer: 1,
      explain:
        "Two checkouts of the same branch would fight over the same ref. Use a new branch or a detached HEAD if the VM allows it.",
    },
    {
      id: "wt-q3",
      prompt: "When should you worktree instead of stash?",
      choices: [
        "A five-second interrupt to look at git status",
        "You need two branches built/tested at once, without hiding work in refs/stash",
        "You want to delete objects",
        "You are resolving stash stages 1/2/3",
      ],
      answer: 1,
      explain:
        "Stash hides a snapshot on W. A worktree keeps a real directory you can compile.",
    },
    {
      id: "wt-q4",
      prompt: "git fetch in the linked worktree…",
      choices: [
        "Updates only that worktree’s private object store",
        "Updates the shared object database and remote-tracking refs",
        "Cannot see origin",
        "Clones origin again into ../hotfix",
      ],
      answer: 1,
      explain:
        "One database. Remote-tracking refs are in the shared git dir, so every worktree sees the new tips.",
    },
    {
      id: "wt-q5",
      prompt: "A bare repo has no primary worktree. git worktree add…",
      choices: [
        "Creates the first checkout; git worktree list shows (bare)",
        "Fails because a worktree needs an existing checkout of main",
        "Copies objects into a second .git/objects",
        "Checks out every branch into the git dir itself",
      ],
      answer: 0,
      explain:
        "The git dir is marked (bare) until you add a worktree. That add is the first checkout, not a second one.",
    },
  ],
  goalCheck: (snapshot, _state) => {
    return snapshot.worktrees.length >= 2;
  },
};
