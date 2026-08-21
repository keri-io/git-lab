import { commitOnBranch, mainTip, seededLocalFromOrigin } from "../build.ts";
import type { Lesson } from "../types.ts";

const startState = seededLocalFromOrigin();
const initial = mainTip(startState);
const droppedId = commitOnBranch(startState, "main", "wip notes", {
  "README.md": "# demo\n",
  "NOTES.md": "scratch\n",
});

export const lesson: Lesson = {
  id: "gc",
  order: 18,
  title: "Garbage collection: when dangling commits disappear",
  unlocksAfter: ["rewrite"],
  articleUrl: "https://git-scm.com/docs/git-gc",
  narrative:
    `Resetting or rewriting leaves old commits as dangling objects. They stay in .git/objects until garbage collection removes them. The reflog keeps many of those commits reachable for about 90 days by default, so panic-gc is how you lose work you could have reset --hard back to.

git gc packs loose objects and may prune unreachable ones. git gc --prune=now is aggressive: prune immediately instead of waiting for the grace window. To drop commits that only the reflog still references, expire the reflog first: git reflog expire --expire=now --all, then git gc --prune=now. That removes anything not reachable from refs, stash, remotes, or reflog entries.

Real Git also has cruft packs (old unreachable objects kept separately) and git maintenance for scheduled gc. This teaching VM does not pack: plain git gc prints a no-op message. git gc --prune=now deletes unreachable objects from the object database.

main has two commits: initial README, then wip notes. Hard-reset to HEAD~1 so the wip commit dangles but reflog still points at it. Expire the reflog, then prune. The branch label stays on initial; the wip commit and its tree and blobs are gone.`,
  objectives: [
    "Explain that dangling objects persist until GC, and reflog keeps them reachable by default.",
    "Contrast git gc (pack, optional prune) with git gc --prune=now (immediate prune).",
    "Expire reflog before aggressive prune so old tips are not kept alive.",
    "Leave main on the initial commit with the wip notes commit pruned from the database.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git reset --hard HEAD~1",
    "git reflog",
    "git reflog expire --expire=now --all",
    "git gc",
    "git gc --prune=now",
  ],
  demoScript: [
    "git status",
    "git log --oneline",
    "git reset --hard HEAD~1",
    "git reflog expire --expire=now --all",
    "git gc --prune=now",
    "git log --oneline",
  ],
  startState,
  goalHint:
    "Hard-reset to drop the wip commit from main, expire the reflog, then gc --prune=now so the dangling commit is gone.",
  quiz: [
    {
      id: "gc-q1",
      prompt: "git gc vs git gc --prune=now…",
      choices: [
        "Both always delete every dangling commit immediately",
        "gc packs (and may prune later); --prune=now prunes unreachable objects now",
        "gc only touches the reflog; prune touches packs",
        "Neither can remove objects still named by a branch ref",
      ],
      answer: 1,
      explain:
        "GC compacts and cleans. Prune removes unreachable objects; --prune=now skips the usual grace period.",
    },
    {
      id: "gc-q2",
      prompt: "By default, reflog entries keep old commits reachable for about…",
      choices: [
        "One hour",
        "90 days",
        "Forever until you push",
        "Only while git status is clean",
      ],
      answer: 1,
      explain:
        "Reflog expire defaults are measured in days. That is why reset --hard is recoverable for weeks locally.",
    },
    {
      id: "gc-q3",
      prompt: "Cruft packs in real Git…",
      choices: [
        "Store unreachable objects separately instead of deleting them immediately",
        "Replace the reflog entirely",
        "Are created only by git stash",
        "Hold only remote-tracking refs",
      ],
      answer: 0,
      explain:
        "Cruft packs give GC a place to park pruned objects before final deletion.",
    },
    {
      id: "gc-q4",
      prompt: "git maintenance is for…",
      choices: [
        "Force-pushing shared main",
        "Scheduled gc, commit-graph, and other repo housekeeping",
        "Replacing git fetch",
        "Disabling the reflog on clone",
      ],
      answer: 1,
      explain:
        "Maintenance runs background tasks so repos stay packed and pruned without manual gc.",
    },
  ],
  goalCheck: (snapshot, state) => {
    return state.objects[droppedId] === undefined &&
      state.refs["refs/heads/main"] === initial &&
      snapshot.head === initial &&
      snapshot.files["NOTES.md"] === undefined;
  },
};
