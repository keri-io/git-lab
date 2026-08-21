import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "develop", "start develop", {
  "README.md": "# demo\n",
  "dev.md": "integration branch\n",
}, { from: initial, checkout: true });
commitOnBranch(startState, "feature/login", "add login", {
  "README.md": "# demo\n",
  "dev.md": "integration branch\n",
  "login.ts": "export const login = true;\n",
}, {
  checkout: false,
  from: startState.refs["refs/heads/develop"]!,
});

export const lesson: Lesson = {
  id: "gitflow",
  order: 22,
  title: "GitFlow: convention on top of merge",
  unlocksAfter: ["worktrees"],
  articleUrl:
    "https://www.themoderncoder.com/a-better-git-workflow-with-rebase/",
  narrative:
    `GitFlow adds no new Git mechanics. It is a naming scheme plus merge --no-ff so the feature stays a visible bubble instead of fast-forwarding develop into a straight line. main (or master) is production; each commit there is a release. develop is next-release integration.

feature/* lives days to weeks off develop and merges back into develop. release/* freezes develop, merges into main and develop, and is tagged. hotfix/* branches from main and merges into both main and develop.

You do not need the git-flow helper. You need the graph. Long-lived feature/* off develop means large merges. Some CI/CD teams use short-lived branches on main plus feature flags instead.

Learn GitFlow to work in repos that use it; do not assume every project should. The linear rebase workflow from the previous chapters is the other common taste: same primitives, different shape.

You are on develop. feature/login already has login.ts. Merge it with --no-ff so develop gains a two-parent commit even if Git could have fast-forwarded. That bubble is the whole point of the convention.`,
  objectives: [
    "Map main, develop, feature/*, release/*, and hotfix/* to their lifetimes and merge targets.",
    "Use merge --no-ff so a finished feature remains a bubble on develop.",
    "Contrast GitFlow’s merge bubbles with a linear rebase-onto-main workflow.",
    "Finish feature/login into develop with a merge commit.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git merge",
    "git merge --no-ff",
    "git merge --no-ff feature/login",
    "git merge feature/login",
    "git branch",
    "git branch -d",
    "git branch -d feature/login",
    "git switch",
    "git switch develop",
    "git checkout",
    "git switch -c",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git merge --no-ff feature/login",
    "git log --oneline",
    "git branch -d feature/login",
    "git status",
  ],
  startState,
  goalHint:
    "On develop, git merge --no-ff feature/login so HEAD is a two-parent merge commit.",
  quiz: [
    {
      id: "flow-q1",
      prompt: "GitFlow’s merge --no-ff is for…",
      choices: [
        "Deleting feature branches without a commit",
        "Keeping a visible merge bubble even when a fast-forward was possible",
        "Rewriting develop’s hashes",
        "Skipping the index",
      ],
      answer: 1,
      explain:
        "Without --no-ff, a feature that is strictly ahead of develop would only move the develop label. The bubble is the convention.",
    },
    {
      id: "flow-q2",
      prompt: "A hotfix branches from… and merges into…",
      choices: [
        "develop; develop only",
        "main; main and develop",
        "feature/*; main only",
        "origin/main; upstream/main",
      ],
      answer: 1,
      explain:
        "Production fire starts at main, is tagged on main, and is merged back to develop so the fix is not lost.",
    },
    {
      id: "flow-q3",
      prompt: "GitFlow vs the linear rebase workflow…",
      choices: [
        "GitFlow invents new object types",
        "Same primitives; GitFlow prefers --no-ff bubbles, rebase prefers a straight line on main",
        "Rebase cannot exist in a repo that once used GitFlow",
        "GitFlow forbids merge commits",
      ],
      answer: 1,
      explain:
        "You already have switch, merge, fetch, and tags. Naming and --no-ff are policy, not new mechanics.",
    },
    {
      id: "flow-q4",
      prompt: "release/* exists to…",
      choices: [
        "Replace tags",
        "Freeze develop for version bump and QA, then merge into main and develop",
        "Hold untracked files",
        "Store stash W commits",
      ],
      answer: 1,
      explain:
        "Short-lived. Tag the merge on main (v1.2.0). Then delete the release branch.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (snapshot.branch !== "develop" || !snapshot.head) return false;
    const obj = state.objects[snapshot.head];
    return obj?.type === "commit" &&
      obj.parents.length === 2 &&
      snapshot.files["login.ts"] !== undefined;
  },
};
