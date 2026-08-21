import {
  checkoutCommit,
  commitOnBranch,
  mainTip,
  seededLocalFromOrigin,
} from "../build.ts";
import type { GitObject } from "../../git-vm/types.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
const mainId = commitOnBranch(startState, "main", "main work", {
  "README.md": "# demo\n",
  "core.ts": "export const core = 1;\n",
});
commitOnBranch(startState, "feature", "feat step one", {
  "README.md": "# demo\n",
  "feat.ts": "export const a = 1;\n",
}, { from: initial, checkout: false });
const oldFeature = commitOnBranch(startState, "feature", "feat step two", {
  "README.md": "# demo\n",
  "feat.ts": "export const a = 1;\nexport const b = 2;\n",
}, { checkout: false });
startState.HEAD = "refs/heads/feature";
startState.worktrees[0].branch = "feature";
checkoutCommit(startState, oldFeature);

export const lesson: Lesson = {
  id: "rebase",
  order: 10,
  title: "Rebase: cherry-pick in a loop",
  unlocksAfter: ["cherry-pick"],
  articleUrl:
    "https://www.themoderncoder.com/a-better-git-workflow-with-rebase/",
  narrative:
    `Rebase does not move commits. It duplicates them on a new base, with new ids and the same author, date, and message. Git finds the merge base of feature and main and collects commits unique to feature, oldest first. It resets feature to main, cherry-picks each saved commit, and points feature at the last new commit.

Old commits remain until GC. Reflog still has them.

Merge preserves topology (two parents). Rebase replays your commits as if they were written on the new base. Conflicts use the same index stages, one replayed commit at a time: add, then git rebase --continue (or --skip / --abort).

Sequencer state lives under .git/rebase-merge/; do not delete it by hand. The golden rule: do not rebase commits other people already based work on, unless the team agreed to force-push that branch (prefer --force-with-lease).

You are on feature, two commits off the initial README. main has since added core.ts. git rebase main so feature’s two patches sit on top of main work as new hashes. Linear history, no merge bubble.`,
  objectives: [
    "Describe rebase as reset to the new base plus cherry-pick of unique commits.",
    "Expect new hashes even when messages match.",
    "Resolve one replayed commit at a time with --continue / --abort / --skip.",
    "Rebase feature onto main so main is an ancestor of feature.",
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
    "git add",
    "git ls-files",
    "git branch",
    "git switch",
    "git checkout",
    "git reflog",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git rebase main",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "On feature, rebase onto main so your two feature commits are replayed on top of core.ts.",
  quiz: [
    {
      id: "rebase-q1",
      prompt: "After git rebase main, the old feature commits…",
      choices: [
        "Are rewritten in place and keep their hashes",
        "Still exist; feature now points at new commits whose patches were replayed",
        "Are deleted from the object database immediately",
        "Become the second parent of main",
      ],
      answer: 1,
      explain:
        "New objects, moved label. reflog is how you get the old tip back.",
    },
    {
      id: "rebase-q2",
      prompt: "The first step of rebase is…",
      choices: [
        "Force-push origin",
        "Find the merge base, save unique commits, reset the branch to the new base",
        "Create a merge commit with two parents",
        "Stash the worktree",
      ],
      answer: 1,
      explain:
        "Then each saved commit is cherry-picked onto that base, oldest first.",
    },
    {
      id: "rebase-q3",
      prompt: "The golden rule of rebase is…",
      choices: [
        "Always rebase main onto feature before a pull request",
        "Do not rebase commits others already based work on, unless the team agreed",
        "Never rebase a local unpushed branch",
        "Rebase instead of merge on every shared main",
      ],
      answer: 1,
      explain:
        "Rewriting published history forces everyone else to reset. Feature branches can rewrite with agreement and --force-with-lease.",
    },
    {
      id: "rebase-q4",
      prompt: "git pull --rebase is now…",
      choices: [
        "Only a fetch",
        "Fetch, then this replay instead of merge",
        "reset --hard origin/main",
        "cherry-pick origin/main onto HEAD without fetching",
      ],
      answer: 1,
      explain:
        "Same first half as pull; second half is rebase onto the updated tracking branch.",
    },
  ],
  goalCheck: (snapshot, state) => {
    const feature = state.refs["refs/heads/feature"];
    if (!feature || feature === oldFeature) return false;
    if (snapshot.branch !== "feature") return false;
    let cur: string | undefined = feature;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (cur === mainId) {
        const tip = state.objects[feature];
        return tip?.type === "commit" &&
          snapshot.files["core.ts"] !== undefined &&
          snapshot.files["feat.ts"] !== undefined;
      }
      const obj: GitObject | undefined = state.objects[cur];
      if (!obj || obj.type !== "commit") break;
      cur = obj.parents[0];
    }
    return false;
  },
};
