import {
  commitOnBranch,
  mainTip,
  seededLocalFromOrigin,
} from "../build.ts";
import { commitFiles } from "../../git-vm/repo.ts";
import type { GitObject } from "../../git-vm/types.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
const mainId = commitOnBranch(startState, "main", "main work", {
  "README.md": "# demo\n",
  "core.ts": "export const core = 1;\n",
});
const wip = commitOnBranch(startState, "wip", "only A", {
  "README.md": "# demo\n",
  "a.ts": "export const a = 1;\n",
}, { from: initial, checkout: false });
const oldTopic = commitOnBranch(startState, "topic", "only B", {
  "README.md": "# demo\n",
  "a.ts": "export const a = 1;\n",
  "b.ts": "export const b = 1;\n",
}, { from: wip, checkout: true });

export const lesson: Lesson = {
  id: "rebase-onto",
  order: 16,
  title: "Rebase --onto: replay a slice of history",
  unlocksAfter: ["rebase"],
  articleUrl: "https://git-scm.com/docs/git-rebase",
  narrative:
    `git rebase --onto <newbase> <upstream> [<branch>] replays commits reachable from branch (or HEAD) but not from upstream, onto newbase. Upstream is an exclusive cutoff: commits on the branch side of upstream stay out of the replay list.

Plain git rebase main moves every commit unique to the current branch since the merge base with main. --onto adds a second anchor so you can drop a middle patch, transplant a stack onto another line, or rescue commits after a bad rebase without replaying the whole branch.

Interactive rebase (-i) is a todo script at the top of the replay list: pick, reword, edit, squash, fixup, drop. This VM supports a simplified -i plus --onto. In real Git, --exec runs a command after each pick; this lab does not run --exec.

You are on topic. wip is the parent of topic and holds commit A (a.ts). main has moved forward with core.ts. git rebase --onto main wip topic drops A from the replay and replays only B onto main work. topic should end with core.ts and b.ts, not a.ts.`,
  objectives: [
    "State what --onto, upstream, and optional branch mean in git rebase --onto.",
    "Contrast upstream as an exclusive cutoff with a full-branch rebase.",
    "Use --onto to drop a middle commit and replay the tip onto main.",
    "Leave topic replayed on main with b.ts and core.ts, without a.ts.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git rebase",
    "git rebase --onto main wip topic",
    "git rebase --onto",
    "git rebase -i",
    "git rebase --interactive",
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
    "git rebase --onto main wip topic",
    "git log --oneline",
    "git status",
  ],
  startState,
  goalHint:
    "On topic, run git rebase --onto main wip topic so only B replays onto main work and a.ts drops out.",
  quiz: [
    {
      id: "rebase-onto-q1",
      prompt: "git rebase --onto <newbase> <upstream> [<branch>]…",
      choices: [
        "Moves upstream and newbase to the same commit",
        "Replays commits reachable from branch but not upstream, onto newbase",
        "Merges upstream into newbase with a merge commit",
        "Deletes every commit between upstream and newbase from the object database",
      ],
      answer: 1,
      explain:
        "Git collects the commits on the branch side of upstream, checks out newbase, and cherry-picks each one oldest first.",
    },
    {
      id: "rebase-onto-q2",
      prompt: "Upstream in --onto is…",
      choices: [
        "Inclusive: upstream’s commit is always replayed",
        "Exclusive: commits reachable from upstream are excluded from the replay list",
        "Only a branch name; tags are rejected",
        "The merge base with newbase, always",
      ],
      answer: 1,
      explain:
        "Commits reachable from upstream are not replayed. Only commits after upstream on the branch side enter the todo list.",
    },
    {
      id: "rebase-onto-q3",
      prompt: "Interactive rebase (-i) presents…",
      choices: [
        "A merge conflict marker for every file",
        "A todo script (pick, squash, drop, …) for commits in the replay range",
        "A list of stashes to apply",
        "Only --exec hooks, no pick/squash",
      ],
      answer: 1,
      explain:
        "Each line is one commit oldest-first. drop removes it from the replay; squash folds it into the previous pick.",
    },
    {
      id: "rebase-onto-q4",
      prompt: "git rebase --exec in real Git…",
      choices: [
        "Is required for every rebase in this teaching VM",
        "Runs a command after each pick; this lab does not implement --exec",
        "Replaces interactive rebase entirely",
        "Only works with git merge --squash",
      ],
      answer: 1,
      explain:
        "Real Git can run a hook after each replayed commit. This VM supports simplified -i and --onto without --exec.",
    },
  ],
  goalCheck: (snapshot, state) => {
    const topic = state.refs["refs/heads/topic"];
    if (!topic || topic === oldTopic) return false;
    if (snapshot.branch !== "topic") return false;

    const headFiles = commitFiles(state, topic);
    if (headFiles["b.ts"] === undefined || headFiles["core.ts"] === undefined) {
      return false;
    }
    if (headFiles["a.ts"] !== undefined) return false;
    if (snapshot.files["a.ts"] !== undefined) return false;
    if (snapshot.threeTrees.index.includes("a.ts")) return false;
    if (snapshot.threeTrees.head.includes("a.ts")) return false;

    let cur: string | undefined = topic;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (cur === mainId) return true;
      const obj: GitObject | undefined = state.objects[cur];
      if (!obj || obj.type !== "commit") break;
      cur = obj.parents[0];
    }
    return false;
  },
};
