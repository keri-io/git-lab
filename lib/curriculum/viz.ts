import type { LessonId } from "./types.ts";
import { lessons } from "./mod.ts";

/** One visual beat, aligned 1:1 with `lesson.demoScript`. */
export interface VizBeat {
  caption: string;
  /** Pretty ref to dim-the-rest highlight (main, origin/main, stash, feature, …). */
  highlightRef?: string;
  /** Pulse the three-trees cards. */
  pulseTrees?: boolean;
}

export interface LessonViz {
  intro: string;
  beats: VizBeat[];
}

export const lessonViz: Record<LessonId, LessonViz> = {
  model: {
    intro:
      "Watch the three trees. Worktree already has README.md; index and HEAD are empty until you add and commit.",
    beats: [
      {
        caption:
          "The graph is empty (no commits). status compares the three trees: README.md is untracked — only the worktree has it.",
        pulseTrees: true,
      },
      {
        caption:
          "git add hashes the file into a blob and points the index at it. HEAD still has no commit.",
        pulseTrees: true,
      },
      {
        caption:
          "commit writes a tree from the index, wraps it in a commit object, and slides the main label onto that hash.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "The graph is the object store: one commit, main and HEAD on it. Click the node to inspect parents and the message.",
        highlightRef: "main",
      },
      {
        caption:
          "cat-file -p HEAD prints the commit object: tree, parent list, message. The graph node is that object.",
        highlightRef: "main",
      },
      {
        caption:
          "ls-files is the index. All three trees now agree. Next lessons move these labels without editing old commits.",
        pulseTrees: true,
      },
    ],
  },
  tags: {
    intro:
      "HEAD already has a commit. An annotated tag is a fourth object type; the ref in refs/tags/ points at that tag object, not directly at the commit.",
    beats: [
      {
        caption:
          "main and HEAD sit on the initial commit. No tags exist yet — refs/tags is empty.",
        highlightRef: "main",
      },
      {
        caption:
          "The log is one commit. A tag will name this snapshot without moving main.",
        highlightRef: "main",
      },
      {
        caption:
          "git tag with no arguments lists annotated and lightweight tags. Still none.",
        highlightRef: "main",
      },
      {
        caption:
          "tag -a writes a tag object (object, type, tagger, message) and points refs/tags/v1.0 at it.",
        highlightRef: "v1.0",
      },
      {
        caption:
          "The list now shows v1.0. The graph badge is the tag ref; click the commit it names.",
        highlightRef: "v1.0",
      },
      {
        caption:
          "cat-file -p v1.0 prints the tag object, not the commit. Lightweight tags would print the commit instead.",
        highlightRef: "v1.0",
      },
    ],
  },
  index: {
    intro:
      "README.md in the worktree already differs from HEAD. Watch git diff versus git diff --cached as the index catches up.",
    beats: [
      {
        caption:
          "status: README.md is modified in the worktree. The index still matches HEAD’s blob.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "git diff is worktree versus index. You should see the unstaged “staged later” line.",
        pulseTrees: true,
      },
      {
        caption:
          "git add hashes the worktree bytes into a blob and points the index at it. HEAD is unchanged.",
        pulseTrees: true,
      },
      {
        caption:
          "git diff --cached is index versus HEAD — the snapshot the next commit would record.",
        pulseTrees: true,
      },
      {
        caption:
          "Worktree and index agree; HEAD still has the old README. That gap is what commit would close.",
        highlightRef: "main",
        pulseTrees: true,
      },
    ],
  },
  clone: {
    intro:
      "This lab starts with origin attached and no local commits. Clone is fetch plus checkout — watch origin/main appear, then main.",
    beats: [
      {
        caption:
          "The graph is empty — no local commits. origin is a named object store; nothing has been fetched yet.",
        pulseTrees: true,
      },
      {
        caption:
          "fetch copies objects (pack flash) and writes origin/main. Worktree and local main stay empty — watch the three trees.",
        highlightRef: "origin/main",
        pulseTrees: true,
      },
      {
        caption:
          "checkout main creates refs/heads/main from origin/main, fills the index, and writes files. That is clone’s checkout half.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "Local main and origin/main sit on the same commit. Click it: that object arrived in the pack.",
        highlightRef: "main",
      },
      {
        caption:
          "ls-files shows the index filled from the commit’s tree — not a folder copy.",
        pulseTrees: true,
      },
      {
        caption:
          "Clean status: worktree, index, and HEAD match. origin/main remains a sticky note, not a second checkout.",
        highlightRef: "origin/main",
        pulseTrees: true,
      },
    ],
  },
  packs: {
    intro:
      "Local main is behind origin’s server. Fetch streams a pack of missing objects and moves only origin/main.",
    beats: [
      {
        caption:
          "main and origin/main still share one commit. The extra NOTES.md commit lives only on the remote so far.",
        highlightRef: "main",
      },
      {
        caption:
          "Local log is the README commit. origin/main has not moved on this graph yet.",
        highlightRef: "main",
      },
      {
        caption:
          "fetch copies the missing objects (pack flash) and slides origin/main. Local main and files stay put.",
        highlightRef: "origin/main",
      },
      {
        caption:
          "log origin/main shows the new tip. That history arrived as a pack; it is not a second checkout.",
        highlightRef: "origin/main",
      },
      {
        caption:
          "cat-file prints the remote commit object now stored locally. Real Git would have written a .pack and .idx.",
        highlightRef: "origin/main",
      },
    ],
  },
  reftable: {
    intro:
      "Refs are names in namespaces. Practice heads versus tags; real Git 3.0 stores them in reftable instead of one file per ref.",
    beats: [
      {
        caption:
          "You are on main with one commit. refs/heads/main is the only branch name so far.",
        highlightRef: "main",
      },
      {
        caption:
          "git branch lists local heads. The files backend would be .git/refs/heads/main on disk.",
        highlightRef: "main",
      },
      {
        caption:
          "feature/UI is a nested name under refs/heads. Same commit as main until you add commits.",
        highlightRef: "feature/UI",
      },
      {
        caption:
          "Lightweight git tag v1.0 writes refs/tags/v1.0 pointing at the commit — no tag object.",
        highlightRef: "v1.0",
      },
      {
        caption:
          "Two heads now: main and feature/UI. Reftable would log both updates in one table.",
        highlightRef: "feature/UI",
      },
      {
        caption:
          "git tag lists v1.0. heads and tags are different namespaces even when they name the same hash.",
        highlightRef: "v1.0",
      },
    ],
  },
  fetch: {
    intro:
      "Origin’s main has moved on the server. Until you fetch, origin/main still sits on the same commit as main. Fetch slides only that badge — files stay put.",
    beats: [
      {
        caption:
          "main and origin/main share one commit. Origin has a newer tip on the server — it is not on this graph yet.",
        highlightRef: "main",
      },
      {
        caption:
          "Terminal log is this one commit. origin/main’s badge has not moved; fetch will slide it onto a new node.",
        highlightRef: "main",
      },
      {
        caption:
          "fetch streams a pack and slides origin/main forward. README.md in the worktree must not change.",
        highlightRef: "origin/main",
        pulseTrees: true,
      },
      {
        caption:
          "Terminal log still starts at local main. Click origin/main’s node — it is in the object store, just not checked out.",
        highlightRef: "origin/main",
      },
      {
        caption:
          "status stays clean on the old snapshot. Fetch never merges. Pull is the next lesson.",
        pulseTrees: true,
      },
    ],
  },
  merge: {
    intro:
      "feature overlaps README.md with main. Conflict stages 1/2/3 appear in Index Stages, not on the DAG. After you resolve, watch the graph grow a two-parent bubble.",
    beats: [
      {
        caption: "You are on main. feature is the other tip you will merge.",
        highlightRef: "main",
      },
      {
        caption:
          "Terminal log walks HEAD only. The graph still shows feature’s tip on the other line.",
        highlightRef: "main",
      },
      {
        caption: "Two branch labels, two lines of work. Click each tip before merging.",
        highlightRef: "feature",
      },
      {
        caption:
          "Overlapping README.md → conflict. Stages 1/2/3 open in Index Stages — the DAG still has two tips, no merge bubble.",
        highlightRef: "feature",
      },
      {
        caption:
          "ls-files -u lists the unmerged stages. The graph still has two tips; HEAD did not move.",
      },
      {
        caption:
          "checkout --theirs writes stage 3 into the worktree but does not collapse the index. Add is what resolves.",
        pulseTrees: true,
      },
      {
        caption:
          "git add drops stages 1/2/3 to stage 0. The next commit can be the merge.",
        pulseTrees: true,
      },
      {
        caption:
          "The merge commit has two parents. Click it: that is the join, not a fast-forward.",
        highlightRef: "main",
      },
      {
        caption: "Log now includes both lines. The bubble is the merge commit.",
        highlightRef: "main",
      },
      {
        caption: "Clean tree. Stages are gone. You kept theirs by adding it.",
        pulseTrees: true,
      },
    ],
  },
  rerere: {
    intro:
      "Same README conflict as merge. Enable rerere, record a resolution, abort, then merge again and watch it replay.",
    beats: [
      {
        caption:
          "rerere.enabled is now true. The cache is empty until you git add a resolved conflict.",
        highlightRef: "main",
      },
      {
        caption:
          "On main, feature’s README diverged. Merge will conflict the same way as the previous lesson.",
        highlightRef: "main",
      },
      {
        caption:
          "Conflict: stages 1/2/3 in the index. Worktree has markers. This is the recording input.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "ls-files -u lists base, ours, and theirs. rerere will key the two sides, not the markers.",
        pulseTrees: true,
      },
      {
        caption:
          "checkout --theirs fills README with feature’s bytes. Still unmerged until add.",
        pulseTrees: true,
      },
      {
        caption:
          "git add records ours versus theirs → this blob in the rerere cache, and collapses stages to 0.",
        pulseTrees: true,
      },
      {
        caption:
          "merge --abort restores the worktree. The recorded resolution stays in the cache.",
        highlightRef: "main",
      },
      {
        caption:
          "Second merge hits the same sides, reapplies the cache, and writes the merge commit automatically.",
        highlightRef: "main",
      },
      {
        caption:
          "Clean tree, two-parent tip, no markers. That is reuse of a recorded resolution.",
        highlightRef: "main",
        pulseTrees: true,
      },
    ],
  },
  pull: {
    intro:
      "Pull is fetch plus integrate. First watch origin/main jump, then watch main fast-forward onto it.",
    beats: [
      {
        caption:
          "Local main and origin/main still share one commit. Origin’s server is ahead; files still match the old HEAD.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "fetch only. origin/main moves; main and the worktree stay. Pack flash is new objects.",
        highlightRef: "origin/main",
        pulseTrees: true,
      },
      {
        caption:
          "Terminal log still starts at local main. The graph already shows origin/main on the extra commit — two labels, one checkout.",
        highlightRef: "main",
      },
      {
        caption:
          "pull --ff-only slides main to origin/main and updates index + files. No merge commit.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "HEAD’s log now includes “origin moved” (the commit that added NOTES.md). main and origin/main agree.",
        highlightRef: "origin/main",
      },
      {
        caption: "Clean status. Fast-forward is just moving a pointer.",
        pulseTrees: true,
      },
    ],
  },
  fork: {
    intro:
      "origin is your clone; upstream is the maintainers. Fetch upstream, then merge their main into yours.",
    beats: [
      {
        caption:
          "Three names: main (yours), origin/main, upstream/main. You are behind upstream.",
        highlightRef: "main",
      },
      {
        caption:
          "fetch upstream updates only refs/remotes/upstream/main. Your checkout does not move.",
        highlightRef: "upstream/main",
      },
      {
        caption:
          "merge upstream/main fast-forwards local main. That is “sync the fork.”",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption: "Your main now matches the maintainers’ tip. Click the new HEAD.",
        highlightRef: "main",
      },
      {
        caption: "Worktree matches. origin/main may still lag until you push — not in this lab.",
        pulseTrees: true,
      },
    ],
  },
  amend: {
    intro:
      "Amend never edits a commit. It writes a new object and moves main; the old hash stays in the graph — here origin/main still names it.",
    beats: [
      {
        caption: "HEAD is a commit that forgot extra.md. extra.md sits only in the worktree.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption: "add stages extra.md. The current commit object is unchanged.",
        pulseTrees: true,
      },
      {
        caption:
          "amend --no-edit builds a new commit with the same message. main hops to the new hash; origin/main still sits on the old object.",
        highlightRef: "main",
      },
      {
        caption: "Log shows one tip with a new id. Click both nodes: old parent list vs new tree.",
        highlightRef: "main",
      },
      {
        caption: "reflog still names the old hash. Rewriting is moving labels, not mutating objects.",
      },
      {
        caption:
          "Clean status. Highlight main to dim origin/main’s commit — it is not dangling while that ref still points at it.",
        highlightRef: "main",
        pulseTrees: true,
      },
    ],
  },
  reset: {
    intro:
      "Hard reset moves HEAD, index, and files together. The undone commit stays in the object graph — click it.",
    beats: [
      {
        caption: "main is one commit ahead of the initial README. That extra commit is what you will leave.",
        highlightRef: "main",
      },
      {
        caption: "Log: newest on top. Remember the tip hash; reset will not delete the object.",
        highlightRef: "main",
      },
      {
        caption:
          "--hard HEAD~1 slides main back. Worktree and index match the older commit. The newer node is dangling.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption: "Log no longer lists the undone commit. It is still in the graph if you click the dim node.",
        highlightRef: "main",
      },
      {
        caption: "reflog records the jump. That is how you find the dangling hash later.",
      },
      {
        caption: "Three trees agree on the older snapshot.",
        pulseTrees: true,
      },
    ],
  },
  "cherry-pick": {
    intro:
      "Cherry-pick copies a patch onto HEAD as a brand-new commit. Same message, different hash and parent.",
    beats: [
      {
        caption: "You are on main. The urgent-fix commit lives on another line — find it in the graph.",
        highlightRef: "main",
      },
      {
        caption: "Log of HEAD. The fix is not an ancestor yet.",
        highlightRef: "main",
      },
      {
        caption:
          "cherry-pick applies that diff here. A new node appears with one parent: old HEAD. The original fix stays put.",
        highlightRef: "main",
      },
      {
        caption: "Two commits share a message, not an id. Click both and compare parents.",
        highlightRef: "main",
      },
      {
        caption: "Clean checkout of the copied snapshot.",
        pulseTrees: true,
      },
    ],
  },
  rebase: {
    intro:
      "Rebase is reset to the new base plus cherry-pick of your unique commits. Old feature commits will dangle.",
    beats: [
      {
        caption: "You are on feature, two commits off the old main. main has since moved (core.ts).",
        highlightRef: "feature",
      },
      {
        caption: "Log of feature does not include main’s new commit. Two lines of work.",
        highlightRef: "feature",
      },
      {
        caption:
          "rebase main replays your two patches on top of main. New hashes; old feature nodes dim. No merge bubble.",
        highlightRef: "feature",
      },
      {
        caption: "feature is now a straight line on top of main. Click a new node vs a dangling old one.",
        highlightRef: "feature",
      },
      {
        caption: "Worktree matches the replayed tip.",
        pulseTrees: true,
      },
    ],
  },
  "rebase-onto": {
    intro:
      "topic is B on top of wip’s A; main has since added core.ts. --onto replays only commits after wip onto main.",
    beats: [
      {
        caption:
          "You are on topic. wip holds commit A (a.ts). topic added B (b.ts). main has core.ts.",
        highlightRef: "topic",
      },
      {
        caption:
          "Log of topic includes A then B. Those two sit off the old main, not on core.ts.",
        highlightRef: "topic",
      },
      {
        caption:
          "rebase --onto main wip topic drops A as the cutoff and cherry-picks only B onto main.",
        highlightRef: "topic",
      },
      {
        caption:
          "topic is now B' on top of main work. a.ts is gone; core.ts and b.ts remain. Old B may dangle.",
        highlightRef: "topic",
      },
      {
        caption:
          "Clean checkout of the replayed tip. wip still names commit A; you did not delete that branch.",
        highlightRef: "topic",
        pulseTrees: true,
      },
    ],
  },
  rewrite: {
    intro:
      "Soft reset keeps the index and files, then one new commit replaces two wip nodes. Same idea as squash.",
    beats: [
      {
        caption: "main has an initial commit plus two wip commits. Those two are what you will squash.",
        highlightRef: "main",
      },
      {
        caption:
          "reset --soft HEAD~2 moves the label back two, leaving the index with both wips’ trees combined.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption: "status shows staged changes vs the older HEAD. Nothing was deleted from disk.",
        pulseTrees: true,
      },
      {
        caption: "One new commit. Two old wip nodes dangle. Click the new tip: one parent, one message.",
        highlightRef: "main",
      },
      {
        caption: "Log is initial plus squash. Linear, new hash.",
        highlightRef: "main",
      },
      {
        caption: "reflog still has the wip tips. History rewrite is labels + new objects.",
      },
    ],
  },
  gc: {
    intro:
      "Reset leaves the wip commit dangling. Reflog still reaches it until you expire, then prune deletes the objects.",
    beats: [
      {
        caption:
          "main is on the extra wip notes commit. NOTES.md is in HEAD. That commit is what you will drop.",
        highlightRef: "main",
      },
      {
        caption:
          "Two commits on main: initial README, then wip notes. Reset will move the label backward.",
        highlightRef: "main",
      },
      {
        caption:
          "reset --hard HEAD~1 slides main to the README commit. The wip node dangles but reflog still holds it.",
        highlightRef: "main",
      },
      {
        caption:
          "reflog expire --expire=now --all drops the safety net. Nothing named still points at wip notes.",
        highlightRef: "main",
      },
      {
        caption:
          "gc --prune=now deletes unreachable objects. The dim node disappears from the object store.",
        highlightRef: "main",
      },
      {
        caption:
          "Log is only the initial commit. Real Git also writes cruft packs and git maintenance timers.",
        highlightRef: "main",
      },
    ],
  },
  stash: {
    intro:
      "stash push writes a merge-like W commit (parents H and I) and cleans the worktree. Watch the mauve stash node.",
    beats: [
      {
        caption: "README.md is dirty vs HEAD. That diff is what stash will snapshot.",
        highlightRef: "main",
        pulseTrees: true,
      },
      {
        caption:
          "stash push creates W with parents HEAD (H) and the index commit (I). Worktree returns to HEAD.",
        highlightRef: "stash",
      },
      {
        caption: "Clean status. The WIP lives on the stash ref, not in the worktree.",
        pulseTrees: true,
      },
      {
        caption: "Log of HEAD is unchanged. The stash node is extra — click W, H, and I.",
        highlightRef: "stash",
      },
      {
        caption: "Index matches HEAD again. Stash is a commit graph, not a cloud clipboard.",
        pulseTrees: true,
      },
    ],
  },
  "stash-conflicts": {
    intro:
      "apply replays W onto a moved HEAD. Overlap → stages 1/2/3; drop only after you resolve.",
    beats: [
      {
        caption: "HEAD moved since the stash was taken. stash@{0} still points at W.",
        highlightRef: "stash",
      },
      {
        caption:
          "stash apply replays the worktree commit. Conflict: stages appear; the stash ref is not dropped.",
        highlightRef: "stash",
      },
      {
        caption: "Conflicted status. Graph still has W. You must resolve in the worktree.",
        pulseTrees: true,
      },
      {
        caption: "ls-files -u: stage 1 base, 2 ours, 3 theirs (from the stash).",
      },
      {
        caption: "edit writes the file you want. That is the worktree side of the three trees.",
        pulseTrees: true,
      },
      {
        caption: "add collapses stages to 0. The conflict is recorded as resolved.",
        pulseTrees: true,
      },
      {
        caption:
          "stash drop removes the stash ref. W and I may dangle; HEAD did not rewind.",
        highlightRef: "main",
      },
      {
        caption: "Clean enough to continue. Apply + drop is pop, but you chose when to drop.",
        pulseTrees: true,
      },
    ],
  },
  worktrees: {
    intro:
      "Linked worktrees share the object database. Diamonds are extra checkouts, not copies of Git.",
    beats: [
      {
        caption: "One worktree at `.` on main. Objects live in this repo regardless of extra checkouts.",
        highlightRef: "main",
      },
      {
        caption: "hotfix already exists as a branch. worktree add will check it out elsewhere.",
        highlightRef: "hotfix",
      },
      {
        caption:
          "worktree add ../hotfix hotfix. Two diamonds appear at once: `.` on main and `../hotfix` on the hotfix tip. Same objects.",
        highlightRef: "hotfix",
      },
      {
        caption: "worktree list: `.` on main and `../hotfix` on hotfix. Two checkouts, one object store.",
      },
      {
        caption: "This checkout’s status is still main’s tree. The other tree lives in ../hotfix.",
        pulseTrees: true,
      },
      {
        caption: "Click each diamond and its commit. Two HEADs, one object store.",
        highlightRef: "hotfix",
      },
    ],
  },
  gitflow: {
    intro:
      "GitFlow is naming plus merge --no-ff. You are on develop; keep feature/login as a visible bubble.",
    beats: [
      {
        caption: "develop is checked out. feature/login is the side branch to merge.",
        highlightRef: "develop",
      },
      {
        caption: "Log of develop. feature/login’s commits are the other lane.",
        highlightRef: "develop",
      },
      {
        caption:
          "--no-ff creates a two-parent commit even if Git could fast-forward. That bubble is the convention.",
        highlightRef: "develop",
      },
      {
        caption: "Click the merge node: parents are old develop and feature/login.",
        highlightRef: "develop",
      },
      {
        caption: "Deleting feature/login removes the label, not the commits. The bubble remains.",
        highlightRef: "develop",
      },
      {
        caption: "develop is clean. GitFlow did not add new Git mechanics — only shape.",
        pulseTrees: true,
      },
    ],
  },
  trunk: {
    intro:
      "Trunk-based work is a short-lived branch on main, rebased, then fast-forwarded. No GitFlow bubble.",
    beats: [
      {
        caption:
          "You are on feature/login with login.ts. main has already added core.ts on the trunk.",
        highlightRef: "feature/login",
      },
      {
        caption:
          "Log of the feature does not include core.ts yet. Rebase will replay login on top of trunk.",
        highlightRef: "feature/login",
      },
      {
        caption:
          "rebase main copies the login commit onto main’s tip. New hash; linear history, no merge node.",
        highlightRef: "feature/login",
      },
      {
        caption:
          "switch main. The feature label still sits on the replayed commit, one step ahead of main.",
        highlightRef: "main",
      },
      {
        caption:
          "merge --ff-only slides main to feature/login. If Git needed a merge commit, this would abort.",
        highlightRef: "main",
      },
      {
        caption:
          "Deleting feature/login drops the label. main is a straight line with both core.ts and login.ts.",
        highlightRef: "main",
      },
      {
        caption:
          "Log of trunk is linear. Contrast GitFlow’s --no-ff bubble on develop.",
        highlightRef: "main",
      },
    ],
  },
};

export function getLessonViz(id: string): LessonViz | undefined {
  return lessonViz[id as LessonId];
}

export function vizBeat(id: string, index: number): VizBeat | undefined {
  return getLessonViz(id)?.beats[index];
}

/** Hint after a typed command (not only Play Demo). */
export function vizAfterCommand(
  lessonId: string,
  line: string,
): VizBeat | undefined {
  const viz = getLessonViz(lessonId);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!viz || !lesson) return undefined;
  const trimmed = line.trim();
  const idx = lesson.demoScript.findIndex((cmd) =>
    trimmed === cmd || trimmed.startsWith(`${cmd} `)
  );
  if (idx >= 0) return viz.beats[idx];
  return hintFromPorcelain(trimmed);
}

function hintFromPorcelain(line: string): VizBeat | undefined {
  if (line.startsWith("git fetch")) {
    return {
      caption: "Remote-tracking refs moved. Local branch and files stay until you merge or pull.",
      highlightRef: "origin/main",
    };
  }
  if (line.startsWith("git pull")) {
    return {
      caption: "Fetch plus integrate. If it fast-forwarded, main simply slid to origin/main.",
      highlightRef: "main",
      pulseTrees: true,
    };
  }
  if (line.startsWith("git merge")) {
    return {
      caption: "Look for a two-parent node (merge) or a label that jumped (fast-forward). Conflicts stay in the index.",
    };
  }
  if (line.includes("stash")) {
    return {
      caption: "Stash is commits: W with parents H and I. Click the mauve node.",
      highlightRef: "stash",
    };
  }
  if (line.startsWith("git rebase") || line.startsWith("git cherry-pick")) {
    return {
      caption: "New hashes on the current branch. Old commits may still be on the canvas, dangling.",
    };
  }
  if (line.startsWith("git reset") || line.includes("amend")) {
    return {
      caption: "The branch label moved. Dim nodes are still objects — click them.",
      highlightRef: "main",
    };
  }
  if (line.startsWith("git worktree")) {
    return {
      caption: "Extra diamonds are extra checkouts sharing this object database.",
    };
  }
  if (line.startsWith("git add") || line.startsWith("git commit")) {
    return {
      caption: "Add updates the index; commit writes objects and moves the branch.",
      pulseTrees: true,
    };
  }
  return undefined;
}
