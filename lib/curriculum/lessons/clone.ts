import { emptyState, originFixture } from "../build.ts";
import type { Lesson } from "../types.ts";

const { remote, tip } = originFixture();

export const lesson: Lesson = {
  id: "clone",
  order: 4,
  title: "What git clone does",
  unlocksAfter: ["index"],
  narrative:
    `git clone is not “download the files.” It is init, plus recording a remote, plus fetch, plus checkout. The remote named origin is a config alias whose fetch refspec copies their refs/heads/* into your refs/remotes/origin/*. After negotiation, the server streams one pack of objects you do not already have.

Clone’s first fetch has an empty have list, so you receive the reachable history of the advertised tips. Remote-tracking refs such as refs/remotes/origin/main are local sticky notes: “last time I looked, origin’s main was this commit.” They are not branches you work on.

Clone then creates a local branch, points HEAD at it, fills the index from that commit’s tree, and writes blobs out as files. After that you have a full object database and can work offline. Network is only for later fetch and push.

git clone --bare copies objects and refs only. It skips the working tree, the index, and checkout. That is the server shape: a git dir of history with no files to edit beside it.

In this lab there is no separate git clone verb. The origin remote is already attached, empty of local commits. Fetch origin, then check out main so Git can create refs/heads/main from origin/main, materialize README.md, and stage it in the index. That is the checkout half of clone.`,
  objectives: [
    "Unpack clone as init + remote + fetch + checkout.",
    "Treat origin/main as a local remote-tracking ref, not a second working copy.",
    "Fetch objects from origin and create local main so the worktree matches the tip.",
    "Confirm the index and files were filled from the commit’s tree.",
  ],
  allowedCommands: [
    "git status",
    "git log",
    "git log --oneline",
    "git fetch",
    "git fetch origin",
    "git clone --bare",
    "git clone --bare origin",
    "git checkout",
    "git checkout main",
    "git checkout -b main",
    "git switch",
    "git switch main",
    "git branch",
    "git ls-files",
    "git cat-file",
    "git remote",
  ],
  demoScript: [
    "git status",
    "git fetch origin",
    "git checkout main",
    "git log --oneline",
    "git ls-files",
    "git status",
  ],
  startState: (() => {
    const state = emptyState();
    state.remotes.origin = remote;
    return state;
  })(),
  goalHint:
    "Fetch origin, then check out main so HEAD, the index, and README.md all match origin’s tip.",
  quiz: [
    {
      id: "clone-q1",
      prompt: "Which sequence is clone?",
      choices: [
        "checkout, then fetch, then init",
        "init + remote add + fetch + checkout",
        "merge origin/main into an empty index",
        "copy the working tree over SSH without objects",
      ],
      answer: 1,
      explain:
        "Clone writes a .git, records origin’s refspec, fetches a pack, then checks out the default branch into index and files.",
    },
    {
      id: "clone-q2",
      prompt: "refs/remotes/origin/main is…",
      choices: [
        "A branch you should commit on directly",
        "A file on the origin server that Git edits remotely",
        "A local ref remembering origin’s last advertised main",
        "The same object as HEAD after every command",
      ],
      answer: 2,
      explain:
        "Remote-tracking refs live in your repo. Fetch updates them; your working branch only moves when you merge, rebase, or reset.",
    },
    {
      id: "clone-q3",
      prompt: "After a normal clone, why can you work offline?",
      choices: [
        "Git stores only the latest snapshot and re-downloads history later",
        "The object database, remote-tracking refs, local branch, index, and worktree are already local",
        "The index is a complete backup of origin",
        "HEAD contains the packfile",
      ],
      answer: 1,
      explain:
        "Clone copies objects, not only files. Later network is fetch/push, not a requirement to git log or commit.",
    },
    {
      id: "clone-q4",
      prompt: "The + in +refs/heads/*:refs/remotes/origin/* means…",
      choices: [
        "Create a merge commit on every fetch",
        "Update the destination even if the update is not a fast-forward",
        "Fetch tags only",
        "Delete local branches that origin deleted",
      ],
      answer: 1,
      explain:
        "The plus forces the ref update. Fetch is allowed to rewind a remote-tracking ref when origin rewrote that branch.",
    },
    {
      id: "clone-q5",
      prompt: "git clone --bare copies…",
      choices: [
        "Objects and refs only: no worktree, index, or checkout",
        "A full checkout plus a second origin remote",
        "Only the latest snapshot files, without objects",
        "The index and worktree, skipping the object database",
      ],
      answer: 0,
      explain:
        "A bare clone is a git dir of objects and refs. There is no working tree to edit and no index to stage.",
    },
  ],
  goalCheck: (snapshot, state) => {
    const local = state.refs["refs/heads/main"];
    const tracking = state.refs["refs/remotes/origin/main"];
    return (
      snapshot.head === tip &&
      local === tip &&
      tracking === tip &&
      snapshot.files["README.md"] === "# demo\n"
    );
  },
};
