import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
commitOnBranch(startState, "main", "trunk work", {
  "README.md": "# demo\n",
  "core.ts": "export const core = 1;\n",
});
commitOnBranch(startState, "feature/login", "add login", {
  "README.md": "# demo\n",
  "login.ts": "export const login = true;\n",
}, { from: initial, checkout: true });

export const lesson: Lesson = {
  id: "trunk",
  order: 23,
  title: "Trunk-based development: short branches on main",
  unlocksAfter: ["gitflow"],
  articleUrl:
    "https://www.themoderncoder.com/a-better-git-workflow-with-rebase/",
  narrative:
    `Trunk-based development (TBD) keeps one integration line—main or trunk—and treats every other branch as short-lived. You branch off main, integrate back within hours or days, and ship incomplete work behind feature flags instead of parking it on a long-lived develop branch.

GitFlow’s merge --no-ff bubbles are a deliberate policy choice: they preserve the shape of finished features on develop. TBD teams often prefer the opposite: rebase the feature onto current main, then fast-forward main with merge --ff-only so history stays a straight line. No two-parent merge commit; the feature’s commits (replayed on the new base) become ordinary ancestors of main.

That does not invent new Git mechanics. You still have switch, rebase, merge, and branch -d. The difference is cadence and graph shape: frequent integration on main, small diffs, CI on every push, and flags to hide unfinished UI instead of a release branch that waits weeks.

You are on feature/login. main already has core.ts; your branch has login.ts but branched before core landed. Rebase onto main, switch to main, fast-forward with --ff-only, delete the feature branch, and leave main as a single-parent tip with both files.`,
  objectives: [
    "Contrast trunk-based short branches on main with GitFlow’s long-lived develop and --no-ff bubbles.",
    "Use feature flags (or similar) to integrate incomplete work without a release branch.",
    "Rebase a feature onto main, then merge --ff-only so main stays linear.",
    "Finish feature/login into main with one parent on HEAD and no feature/login ref.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git rebase",
    "git rebase main",
    "git rebase --continue",
    "git rebase --abort",
    "git rebase --skip",
    "git merge",
    "git merge --ff-only",
    "git merge --ff-only feature/login",
    "git branch",
    "git branch -d",
    "git branch -d feature/login",
    "git switch",
    "git switch main",
    "git switch feature/login",
    "git checkout",
    "git add",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git rebase main",
    "git switch main",
    "git merge --ff-only feature/login",
    "git branch -d feature/login",
    "git log --oneline",
  ],
  startState,
  goalHint:
    "Rebase feature/login onto main, switch to main, merge --ff-only, delete feature/login.",
  quiz: [
    {
      id: "trunk-q1",
      prompt: "Trunk-based development vs GitFlow mainly differs in…",
      choices: [
        "Object types stored in .git/objects",
        "Branch lifetime and graph shape: short branches on main vs long-lived develop with --no-ff bubbles",
        "Whether fetch is allowed",
        "Whether tags exist",
      ],
      answer: 1,
      explain:
        "Same primitives. TBD integrates on main often; GitFlow names develop, release/*, and merge bubbles.",
    },
    {
      id: "trunk-q2",
      prompt: "Feature flags in a TBD team help you…",
      choices: [
        "Skip the index on commit",
        "Merge incomplete work to main while keeping it off for users until ready",
        "Replace git rebase",
        "Force --no-ff on every merge",
      ],
      answer: 1,
      explain:
        "Small, frequent merges on main; hide unfinished behavior in the app instead of a long integration branch.",
    },
    {
      id: "trunk-q3",
      prompt: "merge --ff-only after a rebase onto main…",
      choices: [
        "Always creates a two-parent merge commit",
        "Moves main forward only if it can fast-forward—refuses a merge bubble",
        "Deletes all feature commits from the object database",
        "Requires --no-ff",
      ],
      answer: 1,
      explain:
        "After rebase, feature is strictly ahead of main with shared history; --ff-only slides main to the tip without a merge commit.",
    },
    {
      id: "trunk-q4",
      prompt: "Short-lived feature branches mean…",
      choices: [
        "Never deleting branches after merge",
        "Branching from main (or trunk), integrating back within days, not weeks on develop",
        "Forbidding rebase on shared repos",
        "Using only hotfix/* names",
      ],
      answer: 1,
      explain:
        "The branch exists to isolate a small change until CI passes and review lands—not as a parking lot for the next release.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (snapshot.branch !== "main" || !snapshot.head) return false;
    if (state.refs["refs/heads/feature/login"]) return false;
    const obj = state.objects[snapshot.head];
    return obj?.type === "commit" &&
      obj.parents.length === 1 &&
      snapshot.files["login.ts"] !== undefined &&
      snapshot.files["core.ts"] !== undefined;
  },
};
