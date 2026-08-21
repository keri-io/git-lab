import {
  commitOnBranch,
  reachableCount,
  seededLocalFromOrigin,
} from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
commitOnBranch(startState, "main", "wip one", {
  "README.md": "# demo\n",
  "a.ts": "export const a = 1;\n",
});
commitOnBranch(startState, "main", "wip two", {
  "README.md": "# demo\n",
  "a.ts": "export const a = 1;\n",
  "b.ts": "export const b = 2;\n",
});

export const lesson: Lesson = {
  id: "rewrite",
  order: 17,
  title: "Rewriting history: the same tools, on purpose",
  unlocksAfter: ["rebase-onto"],
  articleUrl: "https://www.themoderncoder.com/rewriting-git-history/",
  narrative:
    `Anything that creates new commits and moves a branch rewrites history. git revert does not: it adds a commit that applies the inverse patch. Use revert on published main.

Interactive rebase is a script (oldest at the top): pick, reword, edit, squash, fixup, drop. This teaching VM does not run rebase -i; the squash recipe here is the same idea with reset --soft and one new commit.

Split a commit with rebase stopping on edit, then reset HEAD^ to uncommit while keeping files, then add -p and commit twice. Bulk rewrite of every descendant (strip a secret) is git-filter-repo, not filter-branch.

Rules: rewrite local unpushed commits freely. Never rewrite shared main. Rewrite a shared feature only with agreement and --force-with-lease. Disaster recovery is reflog then reset --hard, not panic-gc.

main has three commits: initial, wip one (a.ts), wip two (b.ts). Soft-reset to HEAD~2 so HEAD is initial while the index still holds both files, then commit once. Two commits on the branch, one new hash, old wip objects still in the database.`,
  objectives: [
    "Contrast revert (adds an inverse commit) with rewrite (new objects, moved label).",
    "Squash a range with reset --soft and a single commit.",
    "State the policy: local free, shared main never, shared feature only with agreement.",
    "Leave main with two reachable commits: initial plus one squashed wip.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git reset",
    "git reset --soft",
    "git reset --soft HEAD~2",
    "git reset --mixed",
    "git reset --hard",
    "git commit",
    "git revert",
    "git reflog",
    "git add",
    "git ls-files",
  ],
  demoScript: [
    "git log --oneline",
    "git reset --soft HEAD~2",
    "git status",
    'git commit -m "squash wip into one"',
    "git log --oneline",
    "git reflog",
  ],
  startState,
  goalHint:
    "Soft-reset past the two wip commits and make a single new commit so main is initial plus one squash.",
  quiz: [
    {
      id: "rewrite-q1",
      prompt: "git revert <commit>…",
      choices: [
        "Deletes that commit and rewrites descendants",
        "Adds a new commit that applies the inverse patch",
        "Moves the branch to the parent (like reset --hard)",
        "Amends the named commit in place",
      ],
      answer: 1,
      explain:
        "Revert is the safe published-history undo. Reset/rebase rewrite.",
    },
    {
      id: "rewrite-q2",
      prompt: "git reset --soft HEAD~2 then git commit…",
      choices: [
        "Drops the files from those two commits",
        "Keeps their trees in the index and records them as one new commit",
        "Creates a merge commit with two parents",
        "Pushes a force update automatically",
      ],
      answer: 1,
      explain:
        "Soft moves only the label. The index still matches the old tip, so the next commit is a squash.",
    },
    {
      id: "rewrite-q3",
      prompt: "On shared main you should…",
      choices: [
        "rebase -i and force-push",
        "merge or revert, not rewrite",
        "filter-repo without telling anyone",
        "amend the release tag",
      ],
      answer: 1,
      explain:
        "Other clones based work on those hashes. New inverse commits keep the graph honest.",
    },
    {
      id: "rewrite-q4",
      prompt: "After a bad rewrite, do not panic-gc. Do…",
      choices: [
        "git reflog, then reset --hard to the old tip",
        "git clone again from origin immediately",
        "delete .git/objects",
        "git fetch --prune",
      ],
      answer: 0,
      explain:
        "Dangling commits stay reachable from reflog for weeks by default. GC after you panic is how you lose them.",
    },
  ],
  goalCheck: (snapshot, state) => {
    if (!snapshot.head) return false;
    const tip = state.objects[snapshot.head];
    if (!tip || tip.type !== "commit") return false;
    if (reachableCount(state, snapshot.head) !== 2) return false;
    return snapshot.files["a.ts"] !== undefined &&
      snapshot.files["b.ts"] !== undefined;
  },
};
